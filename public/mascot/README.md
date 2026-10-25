# Lately artwork

`lately.png` is the first, forward-facing character extracted from the user-supplied
1536 x 1024 `lately.png` reference sheet. The crop starts at (35, 150) and is
270 x 315 pixels. The sheet has a baked-in gray checkerboard rather than an alpha
channel; the connected colored character was retained and the background made
transparent. Retained RGB pixels are unchanged. No character parts were redrawn,
recolored, or generated.

`lately-blink.png` uses the same frame, with the supplied sheet's closed eyelids
extracted and aligned over the two eye regions. Adjacent cream pixels from the
original frame replace the open eyes. The body, hat, silhouette, and alpha channel
are identical between frames; no full-body pose swap occurs.

Both PNGs are served without lossy image optimization, at the same aspect ratio.
The default animation is a 160ms blink every 5 seconds using a stepped CSS opacity
swap, plus a 3px vertical slide with constant-speed CSS translation, 2.5 seconds
each way. Set `float`
to false to keep only the blink. Reduced motion disables both.
A transparent original export would preserve cleaner edge antialiasing than
extracting from this flattened sheet.
