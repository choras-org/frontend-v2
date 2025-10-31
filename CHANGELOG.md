# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.48](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.47...v0.0.48) (2025-10-31)

### Bug Fixes

- change sources and receivers input autosave to when user not focus on ([a0199ba](https://github.com/ajatdarojat45/frontend-v2/commit/a0199ba1c36e03647ac9d08e6fd743cd34108623))
- change validation inside/outside model method to use Raycaster instead of manual bounding box ([3be9b82](https://github.com/ajatdarojat45/frontend-v2/commit/3be9b821d7390d409ebf651ef9b4ab69d4d36b95))
- double click on sources/receivers make active tab to source and receiver tab ([3084fd5](https://github.com/ajatdarojat45/frontend-v2/commit/3084fd5e6b7c7ceecf2e1f517ee67e970457e707))
- sources and receivers disappear when changing tab ([097bca0](https://github.com/ajatdarojat45/frontend-v2/commit/097bca0e008670cf01b1b20f194a6ade7e739813))
- sources and receivers styling and disable add multiple sources ([b4bc01d](https://github.com/ajatdarojat45/frontend-v2/commit/b4bc01d81a4a77e82ef881a64b3d1fbcb3e1c0dd))
- validation on runSimulationButton ([2aa4350](https://github.com/ajatdarojat45/frontend-v2/commit/2aa43504b2680f15ad280a82d110de55e253436e))

### [0.0.47](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.46...v0.0.47) (2025-10-31)

### Bug Fixes

- remove unused TabsTrigger for auralizations in ResultPage ([8b2e1cd](https://github.com/ajatdarojat45/frontend-v2/commit/8b2e1cdc43db35e2634b30e00d33c57de83f2662))
- wrap SidebarTabs and EditorNav in a fragment for proper rendering ([4b16d42](https://github.com/ajatdarojat45/frontend-v2/commit/4b16d420aa35ea100d20634b170e78ae4dc689e8))

### [0.0.46](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.45...v0.0.46) (2025-10-30)

### Features

- add color adjustment for frequency variations in compare results plots ([314ff4e](https://github.com/ajatdarojat45/frontend-v2/commit/314ff4e4dd1da4b9d3594c4fa4356b1d7d7d7026))
- update TrapezoidOutlineTab height and change default tab to auralizations in ResultPage ([d755936](https://github.com/ajatdarojat45/frontend-v2/commit/d755936878f8ceabacad63533eb8bc170332dd70))

### Bug Fixes

- adjust card width in GeometrySelectionInfo component ([16d4def](https://github.com/ajatdarojat45/frontend-v2/commit/16d4def21c3f155d45394283028163b1362526d9))
- Result Sidebar Tabs height & dropdown stay open ([8976c18](https://github.com/ajatdarojat45/frontend-v2/commit/8976c18deb0730c53fa20c0bbe61cc7cb3a0c15d))
- update EditorNav to conditionally display results tab based on simulation status ([fed40b2](https://github.com/ajatdarojat45/frontend-v2/commit/fed40b24f542877c3beb3ea1260fd0a85a7337fa))
- update simulation filter to check for completedAt instead of status ([f0bf823](https://github.com/ajatdarojat45/frontend-v2/commit/f0bf823582275b084cae0a1e67d553321445c800))

### [0.0.45](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.44...v0.0.45) (2025-10-30)

### Bug Fixes

- change active method if theres one ([9bf567e](https://github.com/ajatdarojat45/frontend-v2/commit/9bf567e38e87d29890aa0adcf630771d3897aac8))
- initialize setting after changing method too ([18facc6](https://github.com/ajatdarojat45/frontend-v2/commit/18facc64b6f608c873ff596949089a4a5b952f28))

### [0.0.44](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.43...v0.0.44) (2025-10-30)

### Features

- add duplicate simulation ([f86edee](https://github.com/ajatdarojat45/frontend-v2/commit/f86edee58b4d94b558cacbc397e26112ae9d2907))
- handle duplicate and autorun new simulation ([83b9c07](https://github.com/ajatdarojat45/frontend-v2/commit/83b9c07b387c7c3ddddc74568c2d11585f629c2b))

### Bug Fixes

- adjust SelectTrigger width in SimulationPicker component ([f12372c](https://github.com/ajatdarojat45/frontend-v2/commit/f12372c7193ec06b10550c835d1ab254cbe95900))
- auto load setting and save to simulation when simulation first create ([a4a5103](https://github.com/ajatdarojat45/frontend-v2/commit/a4a5103d5f8ef1bba5b26196b1f75fc95ae0f1bd))
- axes and gizmo color ([8ec8cf8](https://github.com/ajatdarojat45/frontend-v2/commit/8ec8cf89ed8f2c95bcecb64c59422ae85641053b))
- run the simulation duplicate ([2f761d6](https://github.com/ajatdarojat45/frontend-v2/commit/2f761d608f316a5a27f32d67b85d713373477bf3))
- simulation button when completed ([30571b8](https://github.com/ajatdarojat45/frontend-v2/commit/30571b8b40d4a08f0aed52f050650ae6d8d7d081))
- update label from 'Delete Project' to 'Delete Simulation' in SimulationPicker component ([8fc6156](https://github.com/ajatdarojat45/frontend-v2/commit/8fc6156ed0ff5ea059ec740d4e7988bd1c64b743))
- update simulation when changing method ([4de0ffc](https://github.com/ajatdarojat45/frontend-v2/commit/4de0ffc15ab58239878068ccb346e1d8b7e11119))

### [0.0.43](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.42...v0.0.43) (2025-10-29)

### Features

- add ResultPlots select freqs and download ([a543879](https://github.com/ajatdarojat45/frontend-v2/commit/a5438792398b702865a7d197f6dca714ff8444d8))
- enhance ResultPlots with new series data selector and update chart configuration ([07d1bdf](https://github.com/ajatdarojat45/frontend-v2/commit/07d1bdf45673bd752fa10e5f511581cda9aa419b))
- improve selectCompareResultsPlotsSeriesData to handle time steps and prevent extrapolation ([a8ca368](https://github.com/ajatdarojat45/frontend-v2/commit/a8ca3688b2b97633ee2be4fb8286445cd1acf163))
- update plot axis labels for clarity in ResultPlots component ([d86ead4](https://github.com/ajatdarojat45/frontend-v2/commit/d86ead4e50757e5f406b1c823c26179dac1f155a))

### [0.0.42](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.41...v0.0.42) (2025-10-29)

### [0.0.41](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.40...v0.0.41) (2025-10-28)

### Features

- add clearCompareResults action to cleanup compare results on unmount ([b8b3a17](https://github.com/ajatdarojat45/frontend-v2/commit/b8b3a174b97c1000f43d0e819029b082bd4a94fc))
- add clearCompareResults reducer to reset compare results ([4b25a86](https://github.com/ajatdarojat45/frontend-v2/commit/4b25a8683e6a7e2c338669713dbe1e83fe3bd327))

### Bug Fixes

- remove debug log and filter simulations by completed status ([31c47c3](https://github.com/ajatdarojat45/frontend-v2/commit/31c47c3c55bf3fa7cd77c623377595d710fce647))

### [0.0.40](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.39...v0.0.40) (2025-10-28)

### Bug Fixes

- refetching after reload or loading another simulation ([6c1bece](https://github.com/ajatdarojat45/frontend-v2/commit/6c1bece96f67232994c1d3b1f7f9cc29e74d2deb))

### [0.0.39](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.38...v0.0.39) (2025-10-28)

### Features

- Add onSuccess callback to SimulationForm and manage menu state in SimulationPicker ([fe81879](https://github.com/ajatdarojat45/frontend-v2/commit/fe8187950fbd1825acb935824e67fb4ed15d3c10))
- Add trigger label to DownloadResult component ([2dc8b41](https://github.com/ajatdarojat45/frontend-v2/commit/2dc8b41dabf00779cd2553c6368848e716a85ee5))
- Collapsible Groups ([88f9950](https://github.com/ajatdarojat45/frontend-v2/commit/88f9950adc472beeaa73a802038801c6a731cb51))
- Create simulation on dropdown 3-dots ([4d0376a](https://github.com/ajatdarojat45/frontend-v2/commit/4d0376aabc4523c249076c4e5606d96f997f4790))
- Delete simulation from 3-dots ([b973c57](https://github.com/ajatdarojat45/frontend-v2/commit/b973c57e4591d3c0fcb446e549a1ecdd167101d3))
- Edit simulation from 3-dots ([71642ef](https://github.com/ajatdarojat45/frontend-v2/commit/71642ef9c3c0da6d1bf02aece325c4664df66a2c))
- Show donwload button below the CompareResult ([444f1cb](https://github.com/ajatdarojat45/frontend-v2/commit/444f1cbe4d454f34d9fa37cdd5c451f2bdb105c3))
- update ResultPage sidebar with exit button and adjust CompareResult layout ([6744d81](https://github.com/ajatdarojat45/frontend-v2/commit/6744d81b51cd4da5f11e40932f466f6ec2ce772f))

### Bug Fixes

- Memory leaks cause of visibleSections reference is always new ([3ac21e1](https://github.com/ajatdarojat45/frontend-v2/commit/3ac21e18397693b823808707a10c329616487111))
- Navigate to editor model with no simulation ([3f6cea9](https://github.com/ajatdarojat45/frontend-v2/commit/3f6cea9f3543bdcd0b11e8d66381bbb0c5548781))
- No group label consistency ([b40861f](https://github.com/ajatdarojat45/frontend-v2/commit/b40861fc76be480896f778df9cc1cddb07f248dd))
- Reset form with default values in edit mode and prevent auto-selection in input ([f3c4317](https://github.com/ajatdarojat45/frontend-v2/commit/f3c4317000c6f236b53bbab1dd9f342b4ed0ce12))
- Update button visibility logic in CompareResultItem component ([bb264d7](https://github.com/ajatdarojat45/frontend-v2/commit/bb264d719f32104cae0d038ba9b0bdca28f5d16f))
- Vertical space when folded ([2fcbeb4](https://github.com/ajatdarojat45/frontend-v2/commit/2fcbeb4c8755ce801e665a1ef60902e225f7371d))

### [0.0.38](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.37...v0.0.38) (2025-10-28)

### Bug Fixes

- make grid visible, add grid info, change axesHelper color ([2079a66](https://github.com/ajatdarojat45/frontend-v2/commit/2079a6631e68b518ac0d34444e52cf20cc7b1df0))
- make method dropdown available again ([e73c23a](https://github.com/ajatdarojat45/frontend-v2/commit/e73c23a1696bb474bdeab70cfb5c85ab4aa597c9))

### [0.0.37](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.36...v0.0.37) (2025-10-28)

### Bug Fixes

- simplify conditional rendering for selected material in SurfaceMaterialList ([c8a79d1](https://github.com/ajatdarojat45/frontend-v2/commit/c8a79d1474d492b4d42f5b09f15866aa8d81fee6))

### [0.0.36](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.35...v0.0.36) (2025-10-28)

### Bug Fixes

- correct capitalization of "Create material" button text ([1cbf824](https://github.com/ajatdarojat45/frontend-v2/commit/1cbf824c9a39b1f77912de07ccaa670a7d569035))
- improve UI consistency by updating "Open material library" text and adding separators ([8440c57](https://github.com/ajatdarojat45/frontend-v2/commit/8440c57e3be46055afe59ddde9f3b071c6663114))
- update dialog titles for clarity in SurfaceMaterialList ([4b2666c](https://github.com/ajatdarojat45/frontend-v2/commit/4b2666c451063369ee9a6dcc0a6394f7ed6b8983))

### [0.0.35](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.34...v0.0.35) (2025-10-28)

### Features

- add functionality to open material library from material assignment options ([36759a7](https://github.com/ajatdarojat45/frontend-v2/commit/36759a719c277aac0c08403ffae30a4e11bf66b0))

### [0.0.34](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.33...v0.0.34) (2025-10-28)

### Features

- enhance SurfacesTab with material library and create material dialog functionality ([5322d9e](https://github.com/ajatdarojat45/frontend-v2/commit/5322d9e613cea65dc8eae5d422948259b52ece2d))
- refactor CreateMaterialDialog to accept props for open state management ([36e88e1](https://github.com/ajatdarojat45/frontend-v2/commit/36e88e1d5aad3df2433a118c535bf824ccb6ecc5))
- refactor SurfaceMaterialList to accept props for dialog state management ([3c3c4f5](https://github.com/ajatdarojat45/frontend-v2/commit/3c3c4f5bc02e72bf7dbed93e8d5cd6a5b4c37983))

### [0.0.33](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.32...v0.0.33) (2025-10-28)

### Features

- add mixed material detection for surfaces and update UI accordingly ([b7b6917](https://github.com/ajatdarojat45/frontend-v2/commit/b7b6917a13636c5db1c8d199d793b6a7658cc2da))

### [0.0.32](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.31...v0.0.32) (2025-10-27)

### Features

- Move results tab position to right of side panel; also fix material surfaces width ([95d2d28](https://github.com/ajatdarojat45/frontend-v2/commit/95d2d28d3bf0f209ca6a986e9a90fdbb26d01084))

### Bug Fixes

- add material coefficient chart when hovering in select material ([119ec83](https://github.com/ajatdarojat45/frontend-v2/commit/119ec8332434dd6f58a140d5c8cd9903be146ba2))
- auto saved setting when first loaded ([0674d48](https://github.com/ajatdarojat45/frontend-v2/commit/0674d48ded1665d296f30cf21ab58f2b479bbd93))
- cleanup sources and receivers when changing model ([61da153](https://github.com/ajatdarojat45/frontend-v2/commit/61da153ef14cc6c709c9974517011d4de149ddb3))
- hide simulation button when no simulation available ([ec7924d](https://github.com/ajatdarojat45/frontend-v2/commit/ec7924d9bb85963879dde9edd9f5c6239696d39f))
- Minimum width side panel ([251e9a1](https://github.com/ajatdarojat45/frontend-v2/commit/251e9a1d103069fd3d9e229cb915dc24d5a6e5e0))
- refetch/resuming progress bar when reloading/when selecting the running simulation again ([2e7dc61](https://github.com/ajatdarojat45/frontend-v2/commit/2e7dc61f284df74e258c9c8cca0c0b069eb5ca73))
- Use tailwind utils ([b2a5fa4](https://github.com/ajatdarojat45/frontend-v2/commit/b2a5fa4d022e996ba935033f5b71a860b9b122c6))

### [0.0.31](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.30...v0.0.31) (2025-10-27)

### Bug Fixes

- Adjust layout dimensions for improved visual consistency in ProjectDetailPage ([67eb645](https://github.com/ajatdarojat45/frontend-v2/commit/67eb645121da85800ffec19928cf85272bb00fd7))

### [0.0.30](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.29...v0.0.30) (2025-10-27)

### Features

- Add container query support for responsive card layouts ([b0533f4](https://github.com/ajatdarojat45/frontend-v2/commit/b0533f4eac856a7cc96af313597c68b1b7758278))

### Bug Fixes

- Improve layout and styling of ProjectCard component for better responsiveness ([8343f22](https://github.com/ajatdarojat45/frontend-v2/commit/8343f22e7c9f673acbbc90a7ca97594d8106b90d))
- Refactor ModelCard layout for improved responsiveness and structure ([ee13730](https://github.com/ajatdarojat45/frontend-v2/commit/ee13730009aaf21269dea2fbdb13644df852bb49))
- Update ProjectDetailPage layout for improved responsiveness and image stacking ([1e9c3f6](https://github.com/ajatdarojat45/frontend-v2/commit/1e9c3f6d08b78ef6fb799496057950a51c030a72))

### [0.0.29](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.28...v0.0.29) (2025-10-27)

### Bug Fixes

- Revamp audio upload form with improved file input handling and UI ([ce46a85](https://github.com/ajatdarojat45/frontend-v2/commit/ce46a85f6c85742af7b4ca1d2a2970fcb4e9d605))

### [0.0.28](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.27...v0.0.28) (2025-10-27)

### Bug Fixes

- Hide scrollbar browser ([fb30160](https://github.com/ajatdarojat45/frontend-v2/commit/fb30160a84c6f4e9ff56c00e597d5cb70e37d4da))
- Min & Max width of sidepanel ([d28a14e](https://github.com/ajatdarojat45/frontend-v2/commit/d28a14e7f9936f85b9aa3a29699f61d59bcf4951))
- Sidebar Tabs position ([ce2243b](https://github.com/ajatdarojat45/frontend-v2/commit/ce2243bfe5ca0eb92aaf75042bbe32fff5913ac6))

### [0.0.27](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.26...v0.0.27) (2025-10-27)

### Bug Fixes

- Enhance project sorting by ID for ties in creation and modification dates ([2c2c927](https://github.com/ajatdarojat45/frontend-v2/commit/2c2c927d7a566daedd1a9b3db208e26c2101aace))
- Improve model sorting by ID for ties in creation and modification dates ([d2f24ea](https://github.com/ajatdarojat45/frontend-v2/commit/d2f24ea81edb8a4805a053826f49855f31f2833e))

### [0.0.26](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.25...v0.0.26) (2025-10-27)

### Features

- Dropdown for convolved sound ([ad00857](https://github.com/ajatdarojat45/frontend-v2/commit/ad00857ac86dbbe531f5a6671df6ef1f3536e013))
- Make side-panel resizable ([5c592c5](https://github.com/ajatdarojat45/frontend-v2/commit/5c592c5c0ec3c88787e221057b200ffa83f5b0ac))

### Bug Fixes

- Auralization does not update when re-running simulations ([d15330e](https://github.com/ajatdarojat45/frontend-v2/commit/d15330e082b0eb94653e2dd3260a5561fd12536a))
- Content cannot be scroll after implement resizable pane ([631ad3a](https://github.com/ajatdarojat45/frontend-v2/commit/631ad3a55b0ca5c686e0e5b3b9e590a7ea448612))
- Refresh needed after addition or deletion model ([4ce0f4e](https://github.com/ajatdarojat45/frontend-v2/commit/4ce0f4e063f47df7cc16f4f3874b95b6b0d8ce2d))
- Units missing in the results panel ([f37581e](https://github.com/ajatdarojat45/frontend-v2/commit/f37581ece7529661a1bea2aa5176cc79bd933dbe))
- Viewport width when side-panel is resizing ([7d5c665](https://github.com/ajatdarojat45/frontend-v2/commit/7d5c6650a82457212fdc05e0743bb82f2fbc6795))

### [0.0.25](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.24...v0.0.25) (2025-10-26)

### Features

- display creation and update dates in ProjectCard component ([d23f9ce](https://github.com/ajatdarojat45/frontend-v2/commit/d23f9cefeffbb10af5156a74e6fd8ca1754dba74))
- format and display creation and update dates in ModelCard component ([44adeac](https://github.com/ajatdarojat45/frontend-v2/commit/44adeac39fd75c4eaebaa6030d256ebe7fbf4953))
- implement sorting persistence by updating SortPicker to use local storage ([8357230](https://github.com/ajatdarojat45/frontend-v2/commit/8357230ea987aab012a5f9edb69857483d76edc9))
- refactor sorting logic to persist selected sort option in local storage ([6af4223](https://github.com/ajatdarojat45/frontend-v2/commit/6af42231be36e61816d456b153c6aaec79a3e509))
- update SortPicker options to include 'Newest first' instead of 'Creation date' ([ddbf419](https://github.com/ajatdarojat45/frontend-v2/commit/ddbf419839e5c97a7f6d846d48a5477062ed7435))

### Bug Fixes

- update sorting logic for projects to use 'NEWEST_FIRST' instead of 'CREATION_DATE' ([4f82c16](https://github.com/ajatdarojat45/frontend-v2/commit/4f82c16964a132865199f7887cf6be1152707788))
- update sorting logic to use 'NEWEST_FIRST' for creation date ([3316c8c](https://github.com/ajatdarojat45/frontend-v2/commit/3316c8c66900d1027a9e3455d906c2f6a9d83f4f))

### [0.0.24](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.23...v0.0.24) (2025-10-25)

### Bug Fixes

- correct left positioning in SidebarTabs and update label text for Sources/Receivers ([8b9749f](https://github.com/ajatdarojat45/frontend-v2/commit/8b9749fe6b36a6ee2af9fd2d96910473a3662a8c))

### [0.0.23](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.22...v0.0.23) (2025-10-25)

### Features

- update label text in DownloadResult to uppercase ([a42235a](https://github.com/ajatdarojat45/frontend-v2/commit/a42235a65d07558ecb0ec8aeabacfb3eaa453816))

### [0.0.22](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.21...v0.0.22) (2025-10-25)

### Features

- add choras logo SVG files for color and white variants ([ee4cddd](https://github.com/ajatdarojat45/frontend-v2/commit/ee4cddd1b7a1f74a42c806eb6f5bc2b749ca8aa0))
- add text truncation for breadcrumb items and improve accessibility with title attributes ([0f433aa](https://github.com/ajatdarojat45/frontend-v2/commit/0f433aa38f550e8120e075adbdfd17a7d4b8856f))
- remove Breadcrumb component from ProjectDetailPage title ([434ce62](https://github.com/ajatdarojat45/frontend-v2/commit/434ce6235359bce485ec716cbd0d885912d0c438))
- remove projectTag from Breadcrumb in EditorPage ([0ed14cb](https://github.com/ajatdarojat45/frontend-v2/commit/0ed14cb09e639e42b5487b4475cf64632cd4e95e))
- remove projectTag from Breadcrumb in ResultPage ([11ad1ac](https://github.com/ajatdarojat45/frontend-v2/commit/11ad1aca49a92fbb161697af100faf527e114b07))
- update AppLayout header to use logo images instead of text ([45b8b94](https://github.com/ajatdarojat45/frontend-v2/commit/45b8b949318595643da122702acd6f4e6a2fe174))

### [0.0.21](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.20...v0.0.21) (2025-10-25)

### Features

- add sorting functionality to HomePage with SortPicker component ([7bf235a](https://github.com/ajatdarojat45/frontend-v2/commit/7bf235ad9d7e32eaed4313d4be9f990e86513f76))
- add SortPicker component for sorting options ([c07c322](https://github.com/ajatdarojat45/frontend-v2/commit/c07c3224b2f90298b8e72df996c1f03415c215ac))
- integrate SortPicker for model sorting in ProjectDetailPage ([d4d5827](https://github.com/ajatdarojat45/frontend-v2/commit/d4d582702c0732859510424b4a411a26f50b7d43))

### [0.0.20](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.19...v0.0.20) (2025-10-24)

### Features

- add download functionality for convolved sound ([6d0b985](https://github.com/ajatdarojat45/frontend-v2/commit/6d0b985e57ce4bba1334b4817bb74bff773a79d7))

### [0.0.19](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.18...v0.0.19) (2025-10-23)

### Features

- create new material components ([79205fc](https://github.com/ajatdarojat45/frontend-v2/commit/79205fc9fd58e3fd9a0a6bed2c60c95240f75b18))
- model view option ([bbd10af](https://github.com/ajatdarojat45/frontend-v2/commit/bbd10af932caf0b52de923be8e870292169ffb02))
- surface visibility toggle ([eb75104](https://github.com/ajatdarojat45/frontend-v2/commit/eb7510432bd1d808ec0905c23eaddc5c29cda6a9))

### [0.0.18](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.17...v0.0.18) (2025-10-23)

### [0.0.17](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.16...v0.0.17) (2025-10-23)

### Features

- add lazy loading for simulation results and enhance result parameters selector for improved data handling ([6e2be43](https://github.com/ajatdarojat45/frontend-v2/commit/6e2be43f519856d5d3bcb6023cc42c942f661a1b))
- add modelId to compare results and update related components ([9d747df](https://github.com/ajatdarojat45/frontend-v2/commit/9d747dfcf8b2377fa8545abfa8e98b95b466b626))
- enhance CompareResult and CompareResultItem components with improved result handling and simulation selection ([0b68b31](https://github.com/ajatdarojat45/frontend-v2/commit/0b68b312dcca36faa90059374d13abd2a87b6709))
- enhance EditorNav with simulation result query and conditional rendering ([70ce600](https://github.com/ajatdarojat45/frontend-v2/commit/70ce6006ef2106cb068b51503439ad9fc223dcb4))
- implement ChooseModel component for selecting models in comparison results ([e2a5d58](https://github.com/ajatdarojat45/frontend-v2/commit/e2a5d58e0ee58d1ec1ffd124d229eb70afc300b4))
- implement CompareResult and CompareResultItem components for managing and displaying comparison results ([75c3c8a](https://github.com/ajatdarojat45/frontend-v2/commit/75c3c8a589b08427a583dd24f3504d930e0c6629))
- refactor CompareResult and CompareResultItem components to use centralized color constants and improve color handling in ImpulseResponsePlayer ([653cf55](https://github.com/ajatdarojat45/frontend-v2/commit/653cf5503cbb5bf1eb16c4e8f6f977672178e2c5))
- refactor simulation result handling to use selectors for improved state management and enhance component integration ([7c9cadb](https://github.com/ajatdarojat45/frontend-v2/commit/7c9cadb9196e4395716fc4333d834cba5fa30d38))
- update CompareResult and CompareResultItem components to use isCurrent prop for improved simulation handling and UI interaction ([146ee15](https://github.com/ajatdarojat45/frontend-v2/commit/146ee154c795fb6e0717c4692129150bb53804a6))

### Bug Fixes

- always make text orient towards user ([387b216](https://github.com/ajatdarojat45/frontend-v2/commit/387b2167764db53e77a63ced1be47d955b38ad70))
- change run simulation polling rate to 1 seconds ([81b94e1](https://github.com/ajatdarojat45/frontend-v2/commit/81b94e1e5ec4e11915d48fd5defb80c52c63e71d))
- Results tab not showing up once run simulation completed ([8cd2b74](https://github.com/ajatdarojat45/frontend-v2/commit/8cd2b7441abcc78ec3d98152b3faff6a3ea7d2fc))
- validation run simulation button when something is not valid ([6aa22b0](https://github.com/ajatdarojat45/frontend-v2/commit/6aa22b0024a9367c1937d4e91647a4b449b2f3d0))

### [0.0.16](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.15...v0.0.16) (2025-10-20)

### Features

- add Breadcrumb component and integrate it into EditorPage and ProjectDetailPage ([d0a2f76](https://github.com/ajatdarojat45/frontend-v2/commit/d0a2f76e8d616b3886ad2f618b7af02161daebda))
- add ConvolvedSoundPlayer component and integrate it into ResultAuralizations for audio playback ([c0034e1](https://github.com/ajatdarojat45/frontend-v2/commit/c0034e12b6f47e67dd293d09d53a6cd06a5496b4))
- add DownloadResult component for customizable result downloads and integrate it into ResultPage ([c35ed3b](https://github.com/ajatdarojat45/frontend-v2/commit/c35ed3b9773ae61a84a8c1a412be2ed22d721ad8))
- add DownloadResult component to ResultAuralizations and ResultParameters, include frequency bands constant and roundTo2 helper function ([cb0ece1](https://github.com/ajatdarojat45/frontend-v2/commit/cb0ece168dd87f266288b8097b053a54fca17643))
- add lazy query for fetching simulations by model ID in CreateSimulation component ([27d77e2](https://github.com/ajatdarojat45/frontend-v2/commit/27d77e2c488904fdbca6489399f0eafa4c6bb4ff))
- add ResultAuralizations, ConvolvedSoundPlayer, ImpulseResponsePlayer, and UploadConvolvedAudio components; enhance ResultPage with new features ([cb3e5c4](https://github.com/ajatdarojat45/frontend-v2/commit/cb3e5c485a831302c70d48558a654dfe7443760a))
- add ResultPage and auralization API for impulse response handling ([9dc42e6](https://github.com/ajatdarojat45/frontend-v2/commit/9dc42e6b0e7b7c754534e7274d747678a8f2836e))
- add Tabs component and ResultParameters to ResultPage for improved result organization ([a6b3b07](https://github.com/ajatdarojat45/frontend-v2/commit/a6b3b076893e80748bd3ee1c5ce502a8e7bdb638))
- add TrapezoidOutlineTab component and integrate it into ResultPage for improved tab styling ([5e1a092](https://github.com/ajatdarojat45/frontend-v2/commit/5e1a092d02ad590199185f5f1b51554880443f40))
- enhance DownloadResult button style and update EditorNav tab appearance ([c87570d](https://github.com/ajatdarojat45/frontend-v2/commit/c87570d208ab320b16b74cf2be79b5aea5e4d20e))
- enhance DownloadResult component with simulation result fetching and download functionality ([45b93b1](https://github.com/ajatdarojat45/frontend-v2/commit/45b93b13d862ba36193feb184ee41317b16a8e8a))
- enhance loading states and error handling in ResultAuralizations and ResultParameters components ([932b945](https://github.com/ajatdarojat45/frontend-v2/commit/932b94511fc7773d517399c85a2fc627e39a9751))
- enhance ResultPage with simulation data fetching and filename formatting ([7b5c3c9](https://github.com/ajatdarojat45/frontend-v2/commit/7b5c3c94f42ac0cc4d39c2d0fd1d8b56734834c3))
- enhance styling for Impulse Response and Convolved Sound headings in ResultAuralizations component ([bce21a5](https://github.com/ajatdarojat45/frontend-v2/commit/bce21a5c26370cc626fb1ad6f7b0ef36ba49cf45))
- implement audio handling features with impulse response playback and audio file upload ([ab84bc6](https://github.com/ajatdarojat45/frontend-v2/commit/ab84bc667c3391551d8d3cb0b981916f742c3e4b))
- integrate Breadcrumb component into ResultPage for improved navigation ([f09b93d](https://github.com/ajatdarojat45/frontend-v2/commit/f09b93dacf8a85e88c8542c1dbca938168568e57))
- integrate DownloadResult component into ResultAuralizations for impulse response downloads ([656ca29](https://github.com/ajatdarojat45/frontend-v2/commit/656ca292809a4a4ace07a23d5829ff3eaea1035e))
- integrate react-audio-play for enhanced audio playback in ResultPage ([b4696ec](https://github.com/ajatdarojat45/frontend-v2/commit/b4696ec0314d2ed6c00a3908cb2ec8fdee0ddc08))
- refactor ResultPage to use ResultAuralizations component and update ImpulseResponsePlayer prop type ([0f95f90](https://github.com/ajatdarojat45/frontend-v2/commit/0f95f90ad2d6870ecbfe91d380dfa209ae4ba869))
- update DownloadResult component to support customizable trigger labels and visibility for sections ([58cedf6](https://github.com/ajatdarojat45/frontend-v2/commit/58cedf69ee5dc18468dbe6e151738f1939db7fbc))
- update routing for ResultPage and add EditorNav component for navigation in EditorPage and ResultPage ([1ecd21e](https://github.com/ajatdarojat45/frontend-v2/commit/1ecd21e70c4cd1bca06aae928242963a340a01dc))

### Bug Fixes

- add h-container class to children wrapper in AppLayout for consistent height ([fae7cb0](https://github.com/ajatdarojat45/frontend-v2/commit/fae7cb08696535d5175ae8658ea6ab39a8fa7716))
- add TODO comment for future series data handling in ResultParameters component ([c9ef8d8](https://github.com/ajatdarojat45/frontend-v2/commit/c9ef8d874238eb820756d61b94c8556f7e2f5437))
- add z-index to aside in AppLayout for improved layering ([f237a6d](https://github.com/ajatdarojat45/frontend-v2/commit/f237a6df59b824e6fe5defea73d6968a545b067e))
- adjust AudioPlayer height for consistent styling in ConvolvedSoundPlayer component ([33dc753](https://github.com/ajatdarojat45/frontend-v2/commit/33dc7539c10c95be6aa351de6c72e0f92db43aa4))
- adjust sidebar height in EditorPage for better layout consistency ([6b3cd06](https://github.com/ajatdarojat45/frontend-v2/commit/6b3cd06a90660c21a5044a83e5be67ebf427e2a0))
- correct simulationId prop passed to DownloadResult component in ResultParameters ([751802d](https://github.com/ajatdarojat45/frontend-v2/commit/751802de623659d2fbbc80bae5a45c6e4b03a85b))
- correct tag type for invalidation in updateSimulation mutation ([db8d256](https://github.com/ajatdarojat45/frontend-v2/commit/db8d2563fdcf3d37a9f0a705dd9f1ebe95ec1e14))
- update import for simulation query to use correct hook ([aff74e8](https://github.com/ajatdarojat45/frontend-v2/commit/aff74e8f7305b05275b1c9ee6b59cdf5c57ea2bf))

### [0.0.15](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.13...v0.0.15) (2025-10-19)

### Features

- add new run simulation functionality ([268f89f](https://github.com/ajatdarojat45/frontend-v2/commit/268f89f2e7646b6d9749565d277e36b61b8ba315))

### Bug Fixes

- change debounce value for update settings to 1 second instead of 300ms ([55904a7](https://github.com/ajatdarojat45/frontend-v2/commit/55904a738f5fdb96a81695b52a4427bbc8469390))
- different validation type for source and receiver when close together ([554b20d](https://github.com/ajatdarojat45/frontend-v2/commit/554b20d6ae87cd61f4d247fcda985a7a6f122c9e))
- make source&receivers turns red in viewport when not valid ([6dd6d41](https://github.com/ajatdarojat45/frontend-v2/commit/6dd6d41e85604e553547b5802565273ee89ce390))
- only register click event to (de)select sources/receivers ([968cd81](https://github.com/ajatdarojat45/frontend-v2/commit/968cd811867f28fa02b4401bead5adac16ec2757))
- prevent rendering when there are no projects in "NONE" group ([e605ced](https://github.com/ajatdarojat45/frontend-v2/commit/e605ceda06886ded355fe37c9e260d20fa826ab4))
- settings validation to not exceed the range input and not call update ([43b2e28](https://github.com/ajatdarojat45/frontend-v2/commit/43b2e28c96df76f30b4b97265e6ff340f860d3af))

### [0.0.14](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.13...v0.0.14) (2025-10-19)

### Bug Fixes

- change debounce value for update settings to 1 second instead of 300ms ([55904a7](https://github.com/ajatdarojat45/frontend-v2/commit/55904a738f5fdb96a81695b52a4427bbc8469390))
- different validation type for source and receiver when close together ([554b20d](https://github.com/ajatdarojat45/frontend-v2/commit/554b20d6ae87cd61f4d247fcda985a7a6f122c9e))
- make source&receivers turns red in viewport when not valid ([6dd6d41](https://github.com/ajatdarojat45/frontend-v2/commit/6dd6d41e85604e553547b5802565273ee89ce390))
- only register click event to (de)select sources/receivers ([968cd81](https://github.com/ajatdarojat45/frontend-v2/commit/968cd811867f28fa02b4401bead5adac16ec2757))
- prevent rendering when there are no projects in "NONE" group ([e605ced](https://github.com/ajatdarojat45/frontend-v2/commit/e605ceda06886ded355fe37c9e260d20fa826ab4))
- settings validation to not exceed the range input and not call update ([43b2e28](https://github.com/ajatdarojat45/frontend-v2/commit/43b2e28c96df76f30b4b97265e6ff340f860d3af))

### [0.0.13](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.12...v0.0.13) (2025-10-18)

### Features

- add monaco editor to edit setting with json ([ac9519f](https://github.com/ajatdarojat45/frontend-v2/commit/ac9519ffb3a1f9220fa794ae7f7478bf3ed73d40))
- add settings tab, fetch settings, and update simulation ([7dfc5cd](https://github.com/ajatdarojat45/frontend-v2/commit/7dfc5cd94e3e3b1853911b521d4f6c1840e364e1))

### Bug Fixes

- change simulation actually change the settings ([0823ad6](https://github.com/ajatdarojat45/frontend-v2/commit/0823ad6e8ceb9af36e958c65543c85b2dde04ac6))
- change simulation method refetch the settings and populate docs button ([3784143](https://github.com/ajatdarojat45/frontend-v2/commit/3784143b0ea3a1f410995f18dbd9af4e7aefc3a7))

### [0.0.12](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.11...v0.0.12) (2025-10-18)

### Features

- add lazy query for simulations by model ID and update cache invalidation tags ([1e9bc53](https://github.com/ajatdarojat45/frontend-v2/commit/1e9bc53db2c347825b6112bce873b72b97c96883))

### Bug Fixes

- change validation logic ([6333e9c](https://github.com/ajatdarojat45/frontend-v2/commit/6333e9c96d7eb04a7bdf9d1a35a80de236a5b9e1))
- change validation logic ([d5fbbee](https://github.com/ajatdarojat45/frontend-v2/commit/d5fbbeee2cb308c1c64fd53d31c78be18c79c371))
- change validation logic ([c1d3370](https://github.com/ajatdarojat45/frontend-v2/commit/c1d3370fc047fe19cd9285a1a834b63076a18506))
- validate every source and receivers proximity ([1d02e18](https://github.com/ajatdarojat45/frontend-v2/commit/1d02e187539a4c1fd0d23d7b2dde5ab39a8dd946))

### [0.0.11](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.10...v0.0.11) (2025-10-16)

### Features

- add group management functions for project deletion and storage ([0725f27](https://github.com/ajatdarojat45/frontend-v2/commit/0725f278fa4b2ccbb20e15933192ed066e9aab3f))
- add projectsCount prop to DeleteGroup component for improved project management ([b9ba864](https://github.com/ajatdarojat45/frontend-v2/commit/b9ba8643bf61970af1540af4d183a7d307c92682))
- implement DeleteGroup component with project deletion functionality ([084e547](https://github.com/ajatdarojat45/frontend-v2/commit/084e547ba500c56eb0201cf6ea198d675bea0890))
- integrate Redux for group management and remove localStorage dependency ([c779caa](https://github.com/ajatdarojat45/frontend-v2/commit/c779caadf3fe11d8e9c898201a15f522767c292f))

### Bug Fixes

- add handle propagation in all input source receivers ([8d0f250](https://github.com/ajatdarojat45/frontend-v2/commit/8d0f2503bac8365c9ee81a09d242346d71f8465c))
- add validation to source too, not just receivers ([7632aa6](https://github.com/ajatdarojat45/frontend-v2/commit/7632aa64aefeea9f87c4d50427b8fe55f8e56b1b))
- conflict validation outside model and close to surface ([11e8379](https://github.com/ajatdarojat45/frontend-v2/commit/11e83793669d7baabfbb7187a02c3833f0288766))
- enhance "No projects found" message layout for better user experience ([d90db2c](https://github.com/ajatdarojat45/frontend-v2/commit/d90db2c8f37997cddcea51cf7bc554bfff52b3fc))
- improve sorting logic for unique groups in project selector ([3d9e37e](https://github.com/ajatdarojat45/frontend-v2/commit/3d9e37ec66a7bbf6aee9886ddd7140b8c32d3013))
- move add button to bottom row ([ae8a366](https://github.com/ajatdarojat45/frontend-v2/commit/ae8a36689d45f60ff9afb170b7beef83826fde0c))
- number order for sources not start at 1 ([4584b70](https://github.com/ajatdarojat45/frontend-v2/commit/4584b70d88c5b71a1e70194a3f23ad9a00364c10))
- select outside the sources/receivers, reset selection ([497e4a1](https://github.com/ajatdarojat45/frontend-v2/commit/497e4a16845e1849317bae63571b4293530acccc))
- select receiver deselect source and vice versa ([a024fbb](https://github.com/ajatdarojat45/frontend-v2/commit/a024fbb40b40434ae78ee768221af0a8e36f458c))

### [0.0.10](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.9...v0.0.10) (2025-10-14)

### Features

- add plus icon to ProjectForm trigger in HomePage component ([b51a207](https://github.com/ajatdarojat45/frontend-v2/commit/b51a207d5f3a42a0f6ee33af1ecb7aa3f33058b9))
- add sources & receivers functionality in side tab ([fc8b4e1](https://github.com/ajatdarojat45/frontend-v2/commit/fc8b4e17e50bea52169f64049eb80763824f8d8e))
- add upload icon to ProjectDetailPage for improved user experience ([a831631](https://github.com/ajatdarojat45/frontend-v2/commit/a831631940b3578258fd7d605184e4d9b2b9fb04))
- add WelcomeSidebar component and integrate GitHub icon; update button styles in ProjectForm and UploadModel ([a41a6d1](https://github.com/ajatdarojat45/frontend-v2/commit/a41a6d1e6987486053d2082c831d0cc8241a66ca))
- enhance app layout and styling with sidebar adjustments and font integration ([fc0c6c6](https://github.com/ajatdarojat45/frontend-v2/commit/fc0c6c64ae9d102c9388c628402fa1b16a11398b))
- enhance EmptySimulation component styling and update SidebarTabs for responsive layout ([1ea5aad](https://github.com/ajatdarojat45/frontend-v2/commit/1ea5aadcca53cb019ce2a50cd222d43ba61221e0))
- enhance project management features with group selection and improved UI components ([d9f87ea](https://github.com/ajatdarojat45/frontend-v2/commit/d9f87eada6d4292b838ca6be496f86bb797f2ee3))
- enhance ProjectForm and AppLayout components with improved button styles and labels ([1d1c913](https://github.com/ajatdarojat45/frontend-v2/commit/1d1c9136936f2906059ccab2b3e709f579ab2878))
- material list with simple search ([96d6af0](https://github.com/ajatdarojat45/frontend-v2/commit/96d6af0360ee031adfc1db9eb100f65bb5e4e20c))
- refactor ModelCard component to use Card and DropdownMenu for improved UI and delete functionality ([ed7ff51](https://github.com/ajatdarojat45/frontend-v2/commit/ed7ff515a32073b658f4aa6ab19ea0229ab4ac34))
- select source point feature ([d87e1b1](https://github.com/ajatdarojat45/frontend-v2/commit/d87e1b187eb4bb24235de246bcd518ddb0f2289d))
- set default values for ProjectForm in HomePage and update group fallback to 'NONE' ([dcac32b](https://github.com/ajatdarojat45/frontend-v2/commit/dcac32b869b62835eda0629eb6f4d656c99b0f58))
- update app layout header styling and add custom color variables ([c61bd15](https://github.com/ajatdarojat45/frontend-v2/commit/c61bd15581e2b96e01ce317e19e1bc3f54d707d1))
- update EditorPage title to display model project and name with navigation link ([476a159](https://github.com/ajatdarojat45/frontend-v2/commit/476a159cf89e3b437a32e24c5605e12aba33d15f))
- update ModelCard and UploadModel components for improved UI and functionality; add model image display and delete confirmation ([0819049](https://github.com/ajatdarojat45/frontend-v2/commit/0819049c00b5615aececb11ec1c46e21484642b0))
- update ProjectCard to display up to three model images with adjusted positioning and styling ([ec2ed81](https://github.com/ajatdarojat45/frontend-v2/commit/ec2ed81cf49014739ca6b36d8fdda6fa5e03113b))
- wiring to api for source and receiver ([5633ae8](https://github.com/ajatdarojat45/frontend-v2/commit/5633ae8a3e2d2e34a4a1f4c1b42a4285d9e3129f))

### Bug Fixes

- add validation to update receivers ([c23a053](https://github.com/ajatdarojat45/frontend-v2/commit/c23a053929b100dd59692a987f7c2ce2ca66c443))
- adjust header layout and improve link structure in AppLayout component ([f73e327](https://github.com/ajatdarojat45/frontend-v2/commit/f73e327243f5be969cce72e8ef842450061f611f))
- adjust layout properties in AppLayout component for better responsiveness ([1b8d4aa](https://github.com/ajatdarojat45/frontend-v2/commit/1b8d4aa5aabc310f24b1b0978480559b03130520))
- correct font class for header title in AppLayout component ([72bb849](https://github.com/ajatdarojat45/frontend-v2/commit/72bb849206fd3563a36b1ba09c50eb1767c98cf9))
- transform control rendered double on group. feat: add render receivers functionality ([e4a8935](https://github.com/ajatdarojat45/frontend-v2/commit/e4a8935486b775f7d9e673c1dd38fc0fdf9783c3))

### [0.0.9](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.8...v0.0.9) (2025-10-08)

### Bug Fixes

- click outside modle to reset Geometry Information component ([ea759cc](https://github.com/ajatdarojat45/frontend-v2/commit/ea759cccbf466c2c0a68d49395f5988deae6569e))
- using rhino userData id as stable id to identified material assigment ([f1955aa](https://github.com/ajatdarojat45/frontend-v2/commit/f1955aad7e7c61ef7435e9058fb94a3c0323e9b5))

### [0.0.8](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.7...v0.0.8) (2025-10-08)

### Features

- add CHORAS documentation URL to constants ([3f71d70](https://github.com/ajatdarojat45/frontend-v2/commit/3f71d7097a6d57bb50c0f4aebaaaff7d95754134))
- add edge line to distinguish selection ([ddbebc8](https://github.com/ajatdarojat45/frontend-v2/commit/ddbebc84687081fe40353b4d60f99281adece7b8))
- assignment material individual ([eba4fb7](https://github.com/ajatdarojat45/frontend-v2/commit/eba4fb7b5dc755c609d3179a4d0eb3f6b94dba0d))
- creating sidebar tabs ([389fe19](https://github.com/ajatdarojat45/frontend-v2/commit/389fe19d9bb9d6189945a24dfd1534618b263ad6))
- fetch materials from API ([f414c1f](https://github.com/ajatdarojat45/frontend-v2/commit/f414c1f513355bb4501cb4ee4eb0771e5bcc8c9f))
- material viewer tabs ([e9ce84e](https://github.com/ajatdarojat45/frontend-v2/commit/e9ce84eb15b4e98829e0f7b2728155d627f8b7bc))
- mesh selection highlight ([53693bd](https://github.com/ajatdarojat45/frontend-v2/commit/53693bdfffb0974e8d98b8ff76c93ff25a502258))

### Bug Fixes

- accordion on assign all material ([bfa3fc2](https://github.com/ajatdarojat45/frontend-v2/commit/bfa3fc21d5f9b02fed249fbf40caf48403ddbc1e))
- add simple debounce for update api call ([0b01aa1](https://github.com/ajatdarojat45/frontend-v2/commit/0b01aa1a9649770e966055ae449341f27ae9d123))
- assign material actually update the db ([48d9ba6](https://github.com/ajatdarojat45/frontend-v2/commit/48d9ba6234bdca6e52153d4068093397c61a3487))

### [0.0.7](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.6...v0.0.7) (2025-10-06)

### Bug Fixes

- excess whitespace in the bottom of editor page ([c4ccc07](https://github.com/ajatdarojat45/frontend-v2/commit/c4ccc0768b6f1bbe7864a7d8defb6e747a65a8bf))
- viewport resizing by making viewport fixed, so it can ressize with window size ([93c6b09](https://github.com/ajatdarojat45/frontend-v2/commit/93c6b09159121ede2c329c4ac840052f06df538b))

### [0.0.6](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.5...v0.0.6) (2025-10-04)

### Features

- add simulation methods with relevant links and documentation ([5f3cd22](https://github.com/ajatdarojat45/frontend-v2/commit/5f3cd22280c409602abbae157303cf94e20b3365))
- create 3d viewport with helper ([d469723](https://github.com/ajatdarojat45/frontend-v2/commit/d469723109efda3d745ce28102456360b0fdb964))
- extract file from modelUrl to be parse with rhino3dm and render ([34724d8](https://github.com/ajatdarojat45/frontend-v2/commit/34724d861264901bca366f6ec3ee72e61705dbbb))

### Bug Fixes

- change open model button to redirect to editor page ([b8d28c0](https://github.com/ajatdarojat45/frontend-v2/commit/b8d28c0f596f7f1f4f24f32508908f3594fc789c))
- conflict before merging ([320ff38](https://github.com/ajatdarojat45/frontend-v2/commit/320ff3816cfbf7f41c7161d157def8c91b89b7bf))
- create copy of file that being parsed because of conflict ([22308df](https://github.com/ajatdarojat45/frontend-v2/commit/22308dfdc06c30e2df351fb169101bcdd08cfa06))
- grid visibility from below angle ([126d236](https://github.com/ajatdarojat45/frontend-v2/commit/126d236077e0a1c65cbbc528cf69c16e65ff5dab))
- model caching not active during rendering ([fb699fe](https://github.com/ajatdarojat45/frontend-v2/commit/fb699febeead3f6457233f3494e15bcecf0f10ab))

### [0.0.5](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.4...v0.0.5) (2025-10-03)

### Features

- add EmptySimulation component for handling no simulations state in EditorPage ([fc7fb04](https://github.com/ajatdarojat45/frontend-v2/commit/fc7fb04efd27727240a4a05c4e4f94a2229b7c4d))
- add groupOnly prop to ProjectForm for conditional field rendering ([f8531b2](https://github.com/ajatdarojat45/frontend-v2/commit/f8531b23c7f0411b003940d14fbf5ea43304a61f))
- add model deletion functionality and integrate alert dialog components ([851d17e](https://github.com/ajatdarojat45/frontend-v2/commit/851d17ec3dbf96e7112ad712e8b5845a9b545891))
- add project deletion functionality and integrate dropdown menu for actions ([ae18483](https://github.com/ajatdarojat45/frontend-v2/commit/ae18483994bc020e7fba7d980efb37c9fa2a9e5f))
- add redirect for invalid simulationId in EditorPage ([d8e47af](https://github.com/ajatdarojat45/frontend-v2/commit/d8e47afaf77991cb9dbdf546434a6b4753704e9d))
- Create simulation ([ce4cb39](https://github.com/ajatdarojat45/frontend-v2/commit/ce4cb392e78b81a0f393d8b144444a471b4607e0))
- enhance CreateSimulation component with loading state and update EditorPage layout ([c8517bf](https://github.com/ajatdarojat45/frontend-v2/commit/c8517bff784730a5fbe82ae2ff885377f5ab21be))
- Handle not found page ([4822380](https://github.com/ajatdarojat45/frontend-v2/commit/48223802b7d4b6a3edb033f7fb35ac6cd3a7cd21))
- implement SimulationPicker component and integrate active simulation management in EditorPage ([554d520](https://github.com/ajatdarojat45/frontend-v2/commit/554d5205a6bfd0f2453bbea4767daaf335954eb0))
- integrate ProjectForm for project creation and editing in HomePage ([25745a5](https://github.com/ajatdarojat45/frontend-v2/commit/25745a5442d03ca3de677dbeb297f3606bbb5ab6))

### Bug Fixes

- disable submit button when groupOnly prop is true ([91e0660](https://github.com/ajatdarojat45/frontend-v2/commit/91e0660c260e7587c3d773b4cc938e26c7dbc8cb))
- prevent event bubbling on dropdown and dialog interactions ([8013cd5](https://github.com/ajatdarojat45/frontend-v2/commit/8013cd516e66053d4707a089adecb5c2bb51ef65))
- redirect to first simulation and set it as active when no valid simulationId is provided ([e6c8b68](https://github.com/ajatdarojat45/frontend-v2/commit/e6c8b6822ef130d78cfb16afe724c62367fa4d6d))
- update dependencies in form reset effects and improve code consistency ([4b88837](https://github.com/ajatdarojat45/frontend-v2/commit/4b88837f69f3d7b5da61fdb1c4019fb977f43a5e))

### [0.0.4](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.3...v0.0.4) (2025-10-02)

### Features

- add Prettier integration to ESLint configuration for improved code formatting ([1c552ec](https://github.com/ajatdarojat45/frontend-v2/commit/1c552ecd3fe74a1c58851a56504dc80c85e85fe9))
- implement GroupPicker component and integrate it into HomePage for group selection ([af71078](https://github.com/ajatdarojat45/frontend-v2/commit/af710784a5c6574011a8945950d9f0ad8b2edfd4))

### Bug Fixes

- add no-unused-vars plugin configuration to ESLint for improved linting ([45d03f9](https://github.com/ajatdarojat45/frontend-v2/commit/45d03f9085280a158c527fc779e24d1f44a1f7ad))
- update no-unused-vars rule configuration for improved TypeScript linting ([8892f74](https://github.com/ajatdarojat45/frontend-v2/commit/8892f743f182bd5ae07104ce81a9aea9893052b5))

### [0.0.3](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.2...v0.0.3) (2025-10-01)

### Features

- add CreateGroup component and integrate it into CreateProject for dynamic group creation ([a8a326d](https://github.com/ajatdarojat45/frontend-v2/commit/a8a326df253d0ad92ca2259245d37183f08d3f17))
- add CreateProject component with form validation and group selection ([b27bb50](https://github.com/ajatdarojat45/frontend-v2/commit/b27bb50b713d6cbb1384c26f0595aa9edbf9698e))
- add UploadModel component for 3D model uploads with validation ([1c6f04f](https://github.com/ajatdarojat45/frontend-v2/commit/1c6f04fe9123e539310c93a9d43b87b9f30b317b))
- enhance UploadModel component with file upload logic and integrate into ProjectDetailPage ([19053d0](https://github.com/ajatdarojat45/frontend-v2/commit/19053d0987b4ba3aee00306f95e6d60c5f24c927))
- implement ModelCard component and integrate it into ProjectDetailPage; fix simulation count ([8d34c1e](https://github.com/ajatdarojat45/frontend-v2/commit/8d34c1ec1404a4e25ef32efd420a1851901af1d4))
- integrate AudioLinesIcon into ModelCard and UploadModel components; enhance file upload UI with loading state ([35cf3bf](https://github.com/ajatdarojat45/frontend-v2/commit/35cf3bf01de5b9e35975d19c6a858a96159f5a5c))

### [0.0.2](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.1...v0.0.2) (2025-09-30)

### Features

- add color constants for consistent theming across the application ([54f8c4d](https://github.com/ajatdarojat45/frontend-v2/commit/54f8c4d2e932ff1bd00d7810a414bddd95ad91d8))
- add ProjectDetailPage component and integrate with routing; update project API and selectors ([122e798](https://github.com/ajatdarojat45/frontend-v2/commit/122e7985a49b6794858243d954f78d23bcf7d50a))
- implement ProjectCard component and integrate with HomePage; add simulation API and selectors ([5f2c984](https://github.com/ajatdarojat45/frontend-v2/commit/5f2c98404b45c521b873eed4a4483077c89ee6c3))

### Bug Fixes

- add padding to project cards grid in HomePage ([e3978a3](https://github.com/ajatdarojat45/frontend-v2/commit/e3978a3d3dd428ea1b5b84862842780e76fba9fc))
- adjust image width in ProjectCard and update sidebar width in AppLayout ([1c9857e](https://github.com/ajatdarojat45/frontend-v2/commit/1c9857e560491b6895de899aa0a905448854c8b0))
- adjust sidebar width in AppLayout and update project grid layout in HomePage ([c06ad00](https://github.com/ajatdarojat45/frontend-v2/commit/c06ad000d817b8b52dc5a7fae1f1e1026139961a))
- correct date for version 0.0.0 in CHANGELOG ([c8bd596](https://github.com/ajatdarojat45/frontend-v2/commit/c8bd5969db9008d74448ca8f42896ef306bfc207))

### [0.0.1](https://github.com/ajatdarojat45/frontend-v2/compare/v0.0.0...v0.0.1) (2025-09-30)

### Features

- add axios for HTTP requests and create http instance; update HomePage to fetch projects ([bc11435](https://github.com/ajatdarojat45/frontend-v2/commit/bc11435f30d950042cfbf7f6b0f20bf028298a6d))
- add button component and integrate Tailwind CSS ([91309f6](https://github.com/ajatdarojat45/frontend-v2/commit/91309f67dfd1cffc714d4bebccb12518a608e0f9))
- add react-router and cleanup few things ([3786b03](https://github.com/ajatdarojat45/frontend-v2/commit/3786b03c1f7c3511b8175d8ac6e3fce48a1559be))
- create AppLayout component and update HomePage and EditorPage to use it ([8fb70aa](https://github.com/ajatdarojat45/frontend-v2/commit/8fb70aa021e6c871bc527d1f614d5ed794659ffb))
- integrate Redux Toolkit for state management; add project API and update HomePage and EditorPage components ([58ddc87](https://github.com/ajatdarojat45/frontend-v2/commit/58ddc87f8c754549d8a7631d8b3005fc616176b7))
- update aliases in components.json; create Input component and style utility; remove unused directories ([3163220](https://github.com/ajatdarojat45/frontend-v2/commit/3163220399e6b4e242ece9e008fe160c30f392b1))

## 0.0.0 (2025-09-29)
