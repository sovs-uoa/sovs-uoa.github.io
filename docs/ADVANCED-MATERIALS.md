# Advanced materials, wavelengths and linked objects

An educational model of dispersion, not an optical-design catalogue. Everything is off until **Settings
(the gear) > Advanced materials** is ticked; with it off the program behaves exactly as it always has.

## The model

* A **material** is just two numbers students already meet: the refractive index at the d line, `n_d`
  (587.6 nm), and the Abbe number `V_d = (n_d - 1) / (n_F - n_C)`.
* The index at any wavelength comes from a two-term Cauchy fit through those two numbers,
  `n(lambda) = A + B / lambda^2`, chosen so it reproduces `n_d` and `n_F - n_C` exactly (`js/optics/materials.js`).
* Materials: Air, Water, Ocular media, Fused silica, PMMA, CR-39, BK7, Crown 1.523, Trivex, Polycarbonate,
  High index 1.60 / 1.67 / 1.74, F2 flint, SF11 dense flint. The picker also shows the six-digit glass code.
* **Custom** (the default for any row with no material) is the fixed, non-dispersive index typed in the table
  - the textbook value - and is the same at every wavelength.
* Surfaces need nothing: their power follows from the radius and the media either side. A **thin lens** with a
  material scales its power by `(n - 1) / (n_d - 1)`; a **thin prism** with a material scales its deviation the
  same way. Radii and powers typed in are for the d line.

## Where the wavelength comes from

There is no single "system wavelength". Each **object** has its own (the lambda column of the Objects and Images
table) and its rays are traced through the lens at that wavelength. Whatever describes the lens follows the beam
**in focus** - the one you last dragged or clicked, or whose wavelength you edited (its row is highlighted):

* the Ref. Index column of the Lens Prescription table,
* the Summary,
* the pupils and cardinal points drawn on the diagram.

The wavelength buttons (beside the units box on the prescription tab, and beside the Summary heading) can show
any other wavelength until another object is picked. The stored prescription, and what is saved, always stays at
the d line.

Wavelength pickers list the wavelengths in use (in table order), a divider, then *Custom* (type any nm, 200-3000)
and the rest of the list in numerical order. The list itself (colour name, line, nm, and whether it belongs to the
white-light group) is edited in **Settings > Wavelengths...**.

## Linked objects and white light

Objects can be **linked**: they then share their position / angle / beam width / Pin / Vig and move as one,
while keeping their own wavelength. Tick the box in the link column of two objects of the same kind (both at
infinity, or both finite) to link them; click the link badge to unlink one. Deleting one deletes the group.
**New > white-light group** adds three linked objects, one per wavelength of the white-light group (red, green
and blue by default).

## Appearance (Settings)

* **Light / dark diagram.** *Additive beams* (needs the dark diagram) lets overlapping beams add like light, so
  red + green + blue shows as white. *Beam edge lines* draws a line along the edge of every beam (off by default).
* Reset view (button, or double-click an empty part of the diagram) undoes panning and zooming.

## .lens file additions

All optional, and a file without them loads exactly as before.

* `"material": "BK7"` in the `args` of an `index`, `thin` or `prism` element. An `index` element may omit
  `index` when it names a material.
* Sources (`"sources"`) may carry:
  * `"wavelength": 486.1` - the nm this source is traced at;
  * `"group": 1` - sources sharing a number are linked;
  * `"white": true` - shorthand for a linked group with one copy of the source per wavelength of the
    white-light group (the copies get fresh ids).
* `"settings": { "advancedMaterials": true, "darkCanvas": true, "additiveBeams": true }` - what the file needs
  switched on to make its point. These are applied (and remembered) when the file loads.

Examples: `lenses/dispersion-thick-lens-bk7.lens`, `lenses/dispersion-thin-lens-polycarbonate.lens` and
`lenses/test-prism-dispersion.lens` (the default on Test.html: white light through a dispersive prism).

## Pages are generated

Laboratory1-4, 6, eye and Test are generated from `scripts/laboratory.template.html`: edit the template and run
`node scripts/build-labs.js`. The build also tags each local script and stylesheet with its modified time so
browsers pick up new files.

## Known quirks

* The prism convention comes from the engine: `"base"` is documented there as the direction the image shifts
  towards, which on screen makes a "base down" prism send rays *up*. It is the same for every prism lens.
