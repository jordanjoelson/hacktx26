/** A photo as the paper format shows it. */
export interface PostcardPhoto {
  id: string;
  src: string;
  /** Caption with {name} filled in and markup removed (for alt text and the viewer). */
  caption: string;
  /** Position in PostcardContent.photos, for editing its caption. */
  index: number;
  /** CSS object-position, e.g. "left" or "20% center". */
  focus?: string;
}
