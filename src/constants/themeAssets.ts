import bookCoverDefaultDark from "../../assets/images/bookcover-default-dark.png";
import bookCoverDefault from "../../assets/images/bookcover-default.png";
import emptyDark from "../../assets/images/empty-dark.png";
import empty from "../../assets/images/empty.png";
import pandaDark from "../../assets/images/panda-dark.png";
import panda from "../../assets/images/panda.png";
import pdfPreviewDark from "../../assets/images/pdf-preview-dark.png";
import pdfPreview from "../../assets/images/pdf-preview.png";
import subjectDefaultDark from "../../assets/images/subject-default-dark.png";
import subjectDefault from "../../assets/images/subject-default.png";
import thumbDefaultDark from "../../assets/images/thumb-default-dark.png";
import thumbDefault from "../../assets/images/thumb-default.png";
import userDefaultDark from "../../assets/images/user-default-dark.png";
import userDefault from "../../assets/images/user-default.png";
import welcomeDark from "../../assets/images/welcome-dark.png";
import welcome from "../../assets/images/welcome.png";

export type ThemeAssetName = keyof typeof themeAssets;

export const themeAssets = {
  bookCoverDefault: { light: bookCoverDefault, dark: bookCoverDefaultDark },
  empty: { light: empty, dark: emptyDark },
  panda: { light: panda, dark: pandaDark },
  pdfPreview: { light: pdfPreview, dark: pdfPreviewDark },
  subjectDefault: { light: subjectDefault, dark: subjectDefaultDark },
  thumbDefault: { light: thumbDefault, dark: thumbDefaultDark },
  userDefault: { light: userDefault, dark: userDefaultDark },
  welcome: { light: welcome, dark: welcomeDark },
} as const;

export function getThemeAsset(name: ThemeAssetName, isDark: boolean) {
  const asset = themeAssets[name];
  return isDark ? asset.dark : asset.light;
}
