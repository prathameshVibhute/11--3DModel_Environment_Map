# WebGLCubeRenderTarget

`WebGLCubeRenderTarget` is a Three.js class that creates a render target consisting of six square textures (one per face of a cube), used to store renders of a scene from six different directions — essentially producing an environment map. It's the standard backing store for a `CubeCamera`.

## Constructor Signature

```js
new THREE.WebGLCubeRenderTarget(size, options)
```

### `size`

The `256` in `new THREE.WebGLCubeRenderTarget(256)` is the width and height, in pixels, of each of the six square faces. So `256` means each face is a 256×256 texture, giving a total cubemap resolution of 256 per side.

Common values are powers of two like 128, 256, 512, or 1024 — higher values give sharper reflections but cost more memory and render time (since the scene must be rendered six times, once per face, every time the cube camera updates).

## `options` Object Properties

This second argument accepts the same options as a regular `WebGLRenderTarget`, since `WebGLCubeRenderTarget` extends it. Commonly used ones:

| Property | Description |
|---|---|
| `format` | Pixel format of the textures, e.g. `THREE.RGBAFormat` or `THREE.RGBFormat`. Determines whether alpha is stored. |
| `type` | Data type per channel, e.g. `THREE.UnsignedByteType` (default, 8-bit), `THREE.HalfFloatType`, or `THREE.FloatType`. Float types are needed for HDR environment maps or PMREM generation since they preserve a wider dynamic range. |
| `generateMipmaps` | Boolean; whether mipmaps are generated for the cube texture, useful for roughness-based blurring of reflections (e.g. for PBR materials sampling at different roughness levels). |
| `minFilter` / `magFilter` | Texture filtering, e.g. `THREE.LinearMipmapLinearFilter` for smooth blurred reflections across mip levels. |
| `encoding` (older versions) / `colorSpace` (newer versions) | Color space of the stored data, e.g. `THREE.SRGBColorSpace`, important for correct-looking reflections when combined with tone mapping. |
| `depthBuffer` / `stencilBuffer` | Whether to allocate a depth/stencil buffer, relevant if you need depth information from the cube render (rarely needed for simple reflection probes). |

### Example Setup

A typical setup for real-time reflections looks like:

```js
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
  format: THREE.RGBAFormat
});
```

## Why It's Passed to `CubeCamera`

```js
const cubeCamera = new THREE.CubeCamera(near, far, cubeRenderTarget);
```

`CubeCamera` is not a single camera but an internal array of six `PerspectiveCamera` instances, each pointed along one axis (+X, -X, +Y, -Y, +Z, -Z) with a 90° field of view, so together they cover the full surrounding environment.

When you call `cubeCamera.update(renderer, scene)`, it renders the scene six times — once per internal camera — and needs somewhere to write each of those six renders. That destination is exactly what `WebGLCubeRenderTarget` provides: it's a single object holding six textures (`.texture` is actually a `CubeTexture` referencing all six faces), with one face slot per camera direction.

So the render target is passed to the `CubeCamera` constructor because the camera needs a place to render its six views into, and the resulting `cubeCamera.renderTarget.texture` (a `CubeTexture`) can then be used elsewhere — most commonly as the `envMap` on a material to create real-time reflective or refractive surfaces (mirrors, chrome materials, water, etc.), or fed into `PMREMGenerator` for physically-based lighting.

---

*Note: Property names like `encoding` vs `colorSpace` have changed across Three.js versions — check the docs for the specific version you're using.*
