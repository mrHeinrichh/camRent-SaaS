import { Composition, Folder } from "remotion";
import { CamRentIntro, type CamRentIntroProps } from "./CamRentIntro";

const durationInFrames = 390;
const fps = 30;
const defaultProps = {
  siteUrl: "https://camrentph.vercel.app",
} satisfies Pick<CamRentIntroProps, "siteUrl">;

export const RemotionRoot = () => {
  return (
    <Folder name="CamRent-PH">
      <Composition
        id="CamRentPHDesktopIntro"
        component={CamRentIntro}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{
          ...defaultProps,
          layout: "desktop",
        } satisfies CamRentIntroProps}
      />
      <Composition
        id="CamRentPHMobileIntro"
        component={CamRentIntro}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{
          ...defaultProps,
          layout: "mobile",
        } satisfies CamRentIntroProps}
      />
    </Folder>
  );
};
