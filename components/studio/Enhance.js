"use client";
// تحسين وتكبير أي صورة: ارفع صورة باهتة أو صغيرة، كثّف ألوانها وكبّرها بجودة أعلى. بيشتغل على جهازك.
import { useState } from "react";
import { Drop, Note, styles as s } from "./ui";
import { IMAGE_TYPES, baseName } from "./util";
import ImageEnhancer from "./ImageEnhancer";

export default function Enhance() {
  const [file, setFile] = useState(null);
  return (
    <div className={s.root}>
      <span className={s.badge}><i />بيشتغل على جهازك، وصورك ما بتترفعش</span>
      <Drop accept={IMAGE_TYPES} onFiles={(f) => setFile(f[0])} compact={!!file} title={file ? "صورة تانية" : undefined} hint="صورة اتولّدت باهتة، أو صغيرة وعايزها أكبر وأوضح." />
      {file ? <ImageEnhancer key={file.name + file.size + file.lastModified} source={file} name={baseName(file.name)} /> : <Note>ارفع الصورة وهتشوف الفرق قدامك، وتتحكم في الكثافة والحدّة والتكبير.</Note>}
    </div>
  );
}
