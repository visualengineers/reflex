# reflex-layers

<!-- omit in toc -->
## Table-of-contents

1. [User Interface](#user-interface)
2. [Textures](#textures)
3. [Example Data](#example-data)
4. [Generating KTX files](#generating-ktx-files)
5. [using powershell scripts](#using-powershell-scripts)
6. [Sources for Additional Content](#sources-for-additional-content)
7. [Electron](#electron)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Key Bindings for loading Datasets](#key-bindings-for-loading-datasets)
10. [Interaction Modes](#interaction-modes)
11. [Project Setup and Development](#project-setup-and-development)
12. [Known Issues](#known-issues)

## User Interface

The application features basically three visualization / interaction modes (see also [Interaction Modes](#interaction-modes)).

### Magic Lens (single touch and multi-touch)

Displays a lens containing the layer content of the depth of the deformation at the finger position.

![Magic Lens](/reflex/assets/img/layers/MagicLens.png)

Single Touch (only one lens for the finger causing the highest deformation) and Multi-Touch (one lens for each finger) modes can be selected separately.

Lens Options include the size of the lens, an optional offset from the finger and the specification whether additional information should be displayed on the lens itself.

### Layer Navigation

Displays the layer mapped to the current maximum deformation.

![Layer Navigation](/reflex/assets/img/layersLayerNavigation.png)

### Pixel Blending

Maps the depth information associated to each pixel on the surface to the displayed content by blending images based on the depth value.

![Pixel Blending](/reflex/assets/img/layers/PixelBlending.png)

Pixel Blending Options include developer / debugging options, whether to interpolate depth values for smoother blending and if the sensor calibration should be applied to the depth image.

## Textures

* Textures are specified in `/assets/data/data.json`
* Texture files need to be placed inside the `assets` folder as angular can only access files in this folder
* Textures are grouped into `TextureResources` which contain the data for a specific use case / scenario.

### Texture Formats

1. `Texture2D`
   * multiple images in common file formats (preferably `png` and `jpg`)
   * constraint: maximum 15 images can be used
2. `TextureArray`:
   * Number of images of equal size provided ina single file
   * either in RAW format (raw bit data) or in `Khronos KTX` texture format, could contain 256 or more images
3. `Texture3D`:
   * number of images of equal size, encoded as volumetric data structure
   * either in `DDS` format (raw bit data) or in `Khronos KTX` texture format
   * __REMARK:__ currently not working / not implemented as `three.js` _can_ read and load DDS textures, but binding to a `Texture3d` is not working (it seems that three.js focuses on Texture Arrays)

### Common Properties for TextureResource

* `id`: unique identifier for loading the dataset
* `name`: displayed in the app
* `type`: specify Texture format:
  
  | value | associated format        |
  | ----- | ------------------------ |
  | 0     | Texture2d                |
  | 1     | TextureArray (KTX)       |
  | 2     | TextureArray (RAW Bytes) |
  | 3     | ~~Texture3D (DDS)~~      |
  | 4     | ~~Texture3D (KTX)~~      |

* `folder`: directory in which the files are stored, relative to `assets/data`
* `layers`: Array containing the description of the texture file

### Specific properties for TextureArrays

* `numLayers`: specifies how many textures are stored in the array
* `resX`: width of each texture in the array
* `resY`: height of each texture in the array
* `pixelFormat`: PixelFormat used by THREE.js to interpret the binary data (only needed for raw byte data)

    | value | associated pixel format |
    | ----- | ----------------------- |
    | 1024  | RGB                     |
    | 1028  | RedFormat               |

* layers should contain only a single texture

### App Configuration

There is an optional parameter `config` that can be set for each dataset. It specifies the default settings applied when loading the dataset:

```json

    "config": {
      // default interaction mode: 
      //    0: Pixel Blending, 
      //    1: Magic Lens (single touch)
      //    2: Magic Lens (multi touch)
      //    3: Layer Navigation
      "interaction": 1,          
      "interpolateColor": true,
      // show layers and layer information at the lens
      "showLenseUI": true,
      // show position in the current layer on the side
      "showLayerUI": false,
      // selected mask for Magic Lens (only 3D Textures)
      "defaultLensMaskIdx": 1,
      // selected border color for Magic Lens (only 3D Textures) - RGBA (Hex)
      "lensBorderColor": "#ffff00",
      // scaling factor of lens
      "lensSize": 1.0,
      // horizontal lens offset from finger (Pixel)
      "lensOffsetX": 0.0,
      // vertical lens offset from finger (Pixel)
      "lensOffsetY": 0.0,
      // only for multi-touch Magic lenses: constrain number of available lenses
      "maxNumLenses": 1
    }
```

## Example Data

### Visible Human

* obtained from Visible Human project: [National Library of Medicine](https://www.nlm.nih.gov/research/visible/visible_human.html)

### CT Head Raw TextureArray

* obtained from [CodeProject article](https://www.codeproject.com/Articles/352270/Getting-started-with-Volume-Rendering)
* License: CPOL
* based on Three.js example:
  * [Demo](https://threejs.org/examples/#webgl2_materials_texture2darray)
  * [Code](https://github.com/mrdoob/three.js/blob/master/examples/webgl2_materials_texture2darray.html)

## Generating KTX files

* Install Khronos Texture Tools from github:
* see documentation:
* for creating a layered texture with 10 images use:

``` bash
    "C:\Program Files\KTX-Software\bin\toktx.exe" --t2 --encode etc1s --layers 10 output_texArray @files.txt
```

* creates a `output_texArray.ktx2` file containing the 10 images specified in `files.txt` in ktx2 format (switch `--t2`)
* encoding `etc1s` is mandatory, otherwise, the KTX Loader cannot read the file (`Unsupported vkFormat` or KTXLoader throws a transcoding error)
* __Remark__: texture files __MUST__ have the resolution 1920 x 1080 pixel (if not, batch resizing using tools like [Microsoft PowerToys](https://github.com/microsoft/PowerToys) can help overcome this issue. Resizing in _kopaka1822/ImageViewer_ (see below) does not work, as the files cannot be transcoded properly afterwards)
* __Remark__: file paths in `files.txt` must be relative to the path from which the command is executed, alternatively, the prefix @@ can be used to specify file paths relative to `files.txt`
* __Remark__: currently `KTXLoader2` relies on a WASM transcoder, which needs to be configured at runtime (?). As workaround, the relevant code has been copied to `assets/jsm/`  
  See also:
  * [THREE.js docs](https://threejs.org/docs/index.html#examples/en/loaders/KTX2Loader)
  * [github issue](https://github.com/mrdoob/three.js/pull/24946)
* __Remark__: current version of KTX2Loader requires KTXTools Version __4.1__ or higher (current release candidate: [Download](https://github.com/KhronosGroup/KTX-Software/releases/tag/v4.1.0-rc3))
* __Remark__: There seem to be issues with the color space when using KTX textures. KTX uses linear sRGB color space, Three.js assumes sRGB color space. As a result, colors are way too dark when using KTX textures. Unfortunately, there is no way to specify the color space for the compressed texture. So, the only way is to convert colors in the shader. As utility functions for these operations seem to be broken in the current THREE.js version, manual conversion is necessary in the fragment shader:

``` GLSL

  // conversion from Linear color space to sRGB
  vec4 fromLinear(vec4 linearRGB)
  {
    bvec4 cutoff = lessThan(linearRGB, vec4(0.0031308));
    vec4 higher = vec4(1.055)*pow(linearRGB, vec4(1.0/2.4)) - vec4(0.055);
    vec4 lower = linearRGB * vec4(12.92);

    return mix(higher, lower, cutoff);
  }

  // conversion from Linear color space to sRGB
  vec4 toLinear(vec4 sRGB)
  {
    bvec4 cutoff = lessThan(sRGB, vec4(0.04045));
    vec4 higher = pow((sRGB + vec4(0.055))/vec4(1.055), vec4(2.4));
    vec4 lower = sRGB/vec4(12.92);

    return mix(higher, lower, cutoff);
  }
```

* __Remark:__ there is also a good texture viewer (including KTX textures), available at github: [kopaka1822/ImageViewer @ github](https://github.com/kopaka1822/ImageViewer)
* __Remark:__ if the images contain an ICC profile, the KTX tool fails to create the TextureArray, as  it cannot embed or covert ICC profile data. One workaround is to remove the ICC profile from the files. One tool which can be used for this is [PNGCrush](https://pmt.sourceforge.io/pngcrush/), using the command

  ``` bash
    pngcrush_1_8_11_w64.exe -ow -rem allb -reduce file.png
  ```
  
  or in a batch file iterating over all pngs in a directory (Windows):
  
  ``` bash
    For /R %%i in (*.png) do pngcrush_1_8_11_w64.exe -ow -rem allb -reduce %%i
  ```

## using powershell scripts

There are two PowerShell scripts provided which automate the creation of the file list and creating the ktx command.

* to create the file list, run:

``` PowerShell

  .\create-file-list.ps1 -Path "textures\" -Output "output.txt"

```

to create the file list with the following optional parameters:

* `Path` (default value: `"."`): the path to the texture directory __relative__ script / current directory.

* `Output` (default value: `"files.txt"`): the name of the file in which the files will listed.

Both parameters are optional.

__Remarks__: Files are sorted by name (string sort)

* to create the KTX file, run:

``` PowerShell

  .\create-ktx.ps1 -Path ".\test" -NumLayers 141 -ToolPath "C:\Program Files\KTX-Software\bin\toktx.exe"

```

with the following optional parameters:

* `ToolPath` (default value: "C:\Program Files\KTX-Software\bin\toktx.exe"): The path where the `toktx` tool is installed
* `Path` (default value:  "."): The path to the directory with the files to be listed
* `Output`, (default value: "files.txt",): The name of the files list (must be located in $Path)
* `OutputFile`, (default value: "output_texArray"): The name of the output file
* `NumLayers`, (default value: 10): number of layers / textures in the file list

## Sources for Additional Content

| Additional Content                                   | Link                                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Dresden Hochwasser (2D/3D)                           | [Dresden Hochwasser (arcGis)](https://www.arcgis.com/apps/webappviewer3d/index.html?id=7ab78747a18c4e3faca004dc39070958)  |
| Dresden Themenstadtplan                              | [Dresden Themenstadtplan (cardo.Map)](https://stadtplan.dresden.de/?TH=UW_NO2_L)                                          |
| Historische Karten Europa 1500 - 2008                | [Digitaler Atlas zur Geschichte Europas](https://www.atlas-europa.de/t01/territorien-staaten/t01-territorien-staaten.htm) |
| Altar von Ghent (van Eyck) [__nicht freigegeben !__] | [Closer to van Eyck](http://closertovaneyck.kikirpa.be/)                                                                  |
| Visible Human Head                                   | [National Library of Medicine](https://www.nlm.nih.gov/research/visible/visible_human.html)                               |
| CT Head Raw                                          | [CodeProject article](https://www.codeproject.com/Articles/352270/Getting-started-with-Volume-Rendering)                  |

## Electron

* application can be run as electron app using the command `npm run electron`
* application can be packaged as electron app using  the command `npm run electron-build`
* resulting electron files are stored in the `release` folder
* both commands start a production build before packaging
* __IMPORTANT:__ Windows .exe files are limited to 2GB file size. As NSIS packages all resources into one large installer, this means that you have to be careful regarding the number of texture resources contained in the packaged installer.
  if the package is too large, the application is correctly built and copiend to `win-unpacked` directory, but the installer file is corrupted and the build process fails with an error like this:

  ``` bash
    File: failed creating mmap of "D:\Projekte\ReFlex\reflex-layers\reflex-layers\release\reflex-layers-0.9.0-x64.nsis.7z"
    Error in macro x64_app_files on macroline 1
    Error in macro compute_files_for_current_arch on macroline 7
    Error in macro extractEmbeddedAppPackage on macroline 8
    Error in macro installApplicationFiles on macroline 79
    !include: error in script: "installSection.nsh" on line 66
    Error in script "<stdin>" on line 189 -- aborting creation process
  ```

## Keyboard Shortcuts

The app starts in full screen mode. The following shortcuts are available:

  | Shortcut               | Description                                                                                       |
  | ---------------------- | ------------------------------------------------------------------------------------------------- |
  | `S`                    | Toggle Settings Panel                                                                             |
  | `Esc`                  | Close the application                                                                             |
  | `STRG` + `Shift` + `I` | open dev tools                                                                                    |
  | `STRG` + `R`           | reload app                                                                                        |
  | `STRG` + `M`           | minimize app                                                                                      |
  | `F1` -  `F10`          | load specific Configurations (if defined, see [Key Bindings](#key-bindings-for-loading-datasets)) |

## Key Bindings for loading Datasets

It is possible to assign Keys to specific datasets. This can be done in the `assets/data/keybindings.json` file. So far, only assigning keys `F1` to `F10` has been tested; other might work as well.

Just add a (unique) mapping between key and dataset id in the form `{ "key": "F6", "dataset": 8 }` to the `keyBindings` array.

Example Config:

``` json
  {
    "keyBindings": [
      { "key": "F1", "dataset": 14 },
      { "key": "F2", "dataset": 51 },
      { "key": "F3", "dataset": 60 },
      { "key": "F4", "dataset": 4 },
      { "key": "F5", "dataset": 5 },
      { "key": "F6", "dataset": 8 },
      { "key": "F7", "dataset": 9 },
      { "key": "F8", "dataset": 15 },
      { "key": "F9", "dataset": 1 }
    ]
  }
```

## Interaction Modes

### Pixel Blending

* Blends the image based on the color value from the depth sensor
* Options:
  * __Stream Sensor Depth__: Determine whether raw depth image is used for blending or greyscale representation of filtered PointCloud (_Default:_ __false__)
  * __Show Depth__: for debugging: show streamed depth image (_Default:_ __false__)
  * __Interpolate colors__: smooth depth image fpr reducing artefacts (_Default:_ __true__)
  * __Overrride Depth__: for debugging: manually set depth value (full screen) (_Default:_ __false__)
  * __Min Depth Value__: greyscale value mapped to deepest point (_Default:_ __0.0__)
  * __Zero Depth Value__: greyscale value mapped to zero plane point (_Default:_ __0.5__)
  * __Apply Calibration__: transform depth image based on the translate/scale values derived from the coordinate mapping between sensor and interaction space (_Default:_ __true__). If  this is not set, depth image is stretched to fill the screen space

### Magic Lens (Single or Multi-Touch)

* Displays a lens at the finger position containing the content based on the deformation at the fingertip
* In Single-touch mode, the first touch is used to determine the lens position, in multi-touch mode, a lens for every finger is displayed
* Options:
  * __Lens Size__: Scaling factor for the lens (_Default:_ __1.0__)
  * __Lens Offset X__: move the lens from the fingertips in horizontal direction (_Default:_ __0.0__)
  * __Lens Offset Y__: move the lens from the fingertips in vertical direction (_Default:_ __0.0__)
  * __Show Lens UI__: show current layer at the border of the lens (_Default:_ __true__)
  * __Show Layer UI__: show layers and current position of the lenses at the side of the screen (_Default:_ __true__)

### Layer Navigation

* go through layers by deforming the screen, complete layer is displayed based on the deepest finger position
* Options:
  * __Show Layer UI__: show layers and current position at the side of the screen (_Default:_ __true__)

When using KTX-Arrays, __Lens Modes__ offer an additional option to specify the lens mask. his can be customized to achieve effects such as a fisheye effect. Also, the border color of the lens can be specified.

## Project Setup and Development

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.11.

Run `npm install` in directory `reflex-layers` to install node packages.

### Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### NPM Commands

| Command | Description                         |
| ------- | ----------------------------------- |
| `start` | starts the Angular app on port 4302 |
| `start:electron` | starts the app as packaged electron application |
| `watch` | starts the Angular app on port 4302 in watch mode |
| `build` | builds the Angular app |
| `build:electron` | builds and packages the app as electron application (Target: Win) |
| `test` | executes unit tests via [Karma](https://karma-runner.github.io) |

### Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Known Issues

* updating Electron to Version 31.0.0 resulted in an error in the `KTX2Loader` responsible for loading KTX Textures. The error `Request is not defined` (in the implementation of the `load()` function) is thrown when loading textures (maybe due to a removed node package in Electron).
