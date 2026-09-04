// Without this, the @modal slot's dynamic (.)items/[id] interceptor
// wrongly treats the literal "archive" segment as an item id and tries to
// open it as a modal ("Item not found."). A more specific static match in
// the same slot wins over the dynamic one, so this renders nothing and lets
// the real /items/archive page (a full list, not a modal) load normally.
export default function InterceptedItemArchivePage() {
  return null;
}
