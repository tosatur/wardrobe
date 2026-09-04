// Without this, the @modal slot's dynamic (.)outfits/[id] interceptor
// wrongly treats the literal "new" segment as an outfit id and tries to
// open it as a modal ("Outfit not found."). A more specific static match
// in the same slot wins over the dynamic one, so this renders nothing and
// lets the real /outfits/new page (a full editor, not a modal) load normally.
export default function InterceptedOutfitNewPage() {
  return null;
}
