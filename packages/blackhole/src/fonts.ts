import sources from './embedded/fonts';
const documents = new WeakMap<Document, Promise<unknown>>();
/** Shared immutable font assets; render sessions continue to own all GPU resources. */
export function loadFonts(doc: Document) {
 let loaded = documents.get(doc);
 if (!loaded) {
  loaded = Promise.all(Object.entries(sources).map(async ([family,url]) => {
   if (doc.fonts.check(`12px "${family}"`) && [...doc.fonts].some(font => font.family === family)) return;
   const face = new FontFace(family, `url(${url})`);
   await face.load(); doc.fonts.add(face);
  }));
  documents.set(doc, loaded);
 }
 return loaded;
}
