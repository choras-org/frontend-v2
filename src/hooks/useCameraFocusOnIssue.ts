import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { flattenIssuePoints } from "@/store/geometryIssueSlice";
import type { OrbitControls } from "three-stdlib";
import * as THREE from "three";

export function useCameraFocusOnIssue(orbitControlsRef: React.RefObject<OrbitControls | null>) {
  const { selectedIssue } = useSelector((state: RootState) => state.geometryIssue);
  const animationRef = useRef<number | null>(null);
  const initialCameraPositionRef = useRef<THREE.Vector3 | null>(null);
  const initialTargetRef = useRef<THREE.Vector3 | null>(null);
  const controlsInstanceRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!orbitControlsRef.current) return;

    const controls = orbitControlsRef.current;

    if (controlsInstanceRef.current !== controls) {
      controlsInstanceRef.current = controls;
      initialCameraPositionRef.current = controls.object.position.clone();
      initialTargetRef.current = controls.target.clone();
    }

    const animateCamera = (targetPosition: THREE.Vector3, targetLookAt: THREE.Vector3) => {
      const startPos = controls.object.position.clone();
      const startTarget = controls.target.clone();
      const duration = 600;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        controls.object.position.lerpVectors(startPos, targetPosition, easeProgress);
        controls.target.lerpVectors(startTarget, targetLookAt, easeProgress);
        controls.update();

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
        }
      };

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    if (!selectedIssue) {
      if (initialCameraPositionRef.current && initialTargetRef.current) {
        animateCamera(initialCameraPositionRef.current, initialTargetRef.current);
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    // Calculate center and bounds of the issue points
    const issuePoints = flattenIssuePoints(selectedIssue);
    const points = issuePoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));

    if (points.length === 0) return;

    const center = new THREE.Vector3();
    points.forEach((p) => center.add(p));
    center.divideScalar(points.length);

    // Calculate bounding box to determine adaptive zoom distance
    const box = new THREE.Box3();
    points.forEach((p) => box.expandByPoint(p));

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const fov = controls.object instanceof THREE.PerspectiveCamera ? controls.object.fov : 75;
    const fovRad = (fov * Math.PI) / 180;
    const halfFov = fovRad / 2;

    // Keep tiny issues visible by enforcing a minimum bounding radius.
    const minRadius = 0.25;
    const radius = Math.max(maxDim / 2, minRadius);
    const fitDistance = radius / Math.tan(halfFov);

    const paddingFactor = maxDim < 0.5 ? 4 : maxDim < 2 ? 2.5 : maxDim < 10 ? 1.9 : 1.6;
    const distance = THREE.MathUtils.clamp(fitDistance * paddingFactor, 1.5, 120);

    // Preserve current camera direction so focus movement feels natural.
    const cameraDirection = controls.object.position.clone().sub(controls.target);
    if (cameraDirection.lengthSq() < 1e-8) {
      cameraDirection.set(1, 1, 1);
    }
    cameraDirection.normalize();

    const targetCameraPos = center.clone().addScaledVector(cameraDirection, distance);

    animateCamera(targetCameraPos, center);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedIssue, orbitControlsRef]);
}
