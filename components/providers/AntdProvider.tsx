"use client";

// antd v5 declares peerDeps for React 16-18; this side-effect import enables
// the official React 19 compatibility shim.
import "@ant-design/v5-patch-for-react-19";

import { App, ConfigProvider, theme as antdTheme } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { ReactNode } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * Antd configuration. Theme tokens follow the CrypTalk palette and
 * change between dark and light via useTheme().
 *
 * Style strategy: use Antd for COMPLEX components (Form, Input, Modal,
 * Drawer, Tooltip) where it saves real time. Custom Tailwind handles
 * everything that defines the brand (chat bubbles, landing, layout).
 */
export function AntdProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: isDark ? darkTokens : lightTokens,
          components: isDark ? darkComponents : lightComponents,
        }}
      >
        <App
          notification={{ placement: "topRight", duration: 4 }}
          message={{ duration: 3 }}
        >
          {children}
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}

const FONT = '"Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", sans-serif';

const darkTokens = {
  colorPrimary: "#dcb26e",
  colorInfo: "#dcb26e",
  colorBgBase: "#1a1612",
  colorBgContainer: "#221d17",
  colorBgElevated: "#2a241d",
  colorBgLayout: "#1a1612",
  colorBorder: "#3a3128",
  colorBorderSecondary: "#2e2820",
  colorText: "#f1ebdf",
  colorTextSecondary: "#bbb09a",
  colorTextTertiary: "#8b8170",
  colorTextQuaternary: "#5e574c",
  colorError: "#d97a5e",
  colorWarning: "#dcb26e",
  colorSuccess: "#7eb88f",
  fontFamily: FONT,
  fontSize: 14,
  borderRadius: 10,
  borderRadiusLG: 14,
  borderRadiusSM: 6,
  controlHeight: 38,
  controlHeightLG: 46,
  wireframe: false,
  motionDurationMid: "180ms",
  motionDurationSlow: "260ms",
};

const lightTokens = {
  colorPrimary: "#8a5f24",
  colorInfo: "#8a5f24",
  colorBgBase: "#faf7f0",
  colorBgContainer: "#ffffff",
  colorBgElevated: "#fbf8f1",
  colorBgLayout: "#f3eee3",
  colorBorder: "#e0d9c8",
  colorBorderSecondary: "#ece6d8",
  colorText: "#27201a",
  colorTextSecondary: "#5e574c",
  colorTextTertiary: "#8b8170",
  colorTextQuaternary: "#bbb09a",
  colorError: "#b75233",
  colorWarning: "#a06c1c",
  colorSuccess: "#467f56",
  fontFamily: FONT,
  fontSize: 14,
  borderRadius: 10,
  borderRadiusLG: 14,
  borderRadiusSM: 6,
  controlHeight: 38,
  controlHeightLG: 46,
  wireframe: false,
  motionDurationMid: "180ms",
  motionDurationSlow: "260ms",
};

const darkComponents = {
  Button: { fontWeight: 500, primaryShadow: "none", defaultShadow: "none", dangerShadow: "none" },
  Input: {
    activeBorderColor: "#dcb26e",
    hoverBorderColor: "#5a4d3d",
    activeShadow: "0 0 0 3px rgba(220, 178, 110, 0.18)",
  },
  Modal: { contentBg: "#221d17", headerBg: "transparent", titleColor: "#f1ebdf", footerBg: "transparent" },
  Form: { labelColor: "#bbb09a", labelFontSize: 13, verticalLabelPadding: "0 0 4px" },
  Drawer: { colorBgElevated: "#1a1612" },
  Notification: { colorBgElevated: "#2a241d" },
  Tooltip: { colorBgSpotlight: "#2e2820", colorTextLightSolid: "#f1ebdf" },
};

const lightComponents = {
  Button: { fontWeight: 500, primaryShadow: "none", defaultShadow: "none", dangerShadow: "none" },
  Input: {
    activeBorderColor: "#8a5f24",
    hoverBorderColor: "#bba076",
    activeShadow: "0 0 0 3px rgba(138, 95, 36, 0.14)",
  },
  Modal: { contentBg: "#ffffff", headerBg: "transparent", titleColor: "#27201a", footerBg: "transparent" },
  Form: { labelColor: "#5e574c", labelFontSize: 13, verticalLabelPadding: "0 0 4px" },
  Drawer: { colorBgElevated: "#ffffff" },
  Notification: { colorBgElevated: "#ffffff" },
  Tooltip: { colorBgSpotlight: "#27201a", colorTextLightSolid: "#faf7f0" },
};
