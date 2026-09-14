import React, { useEffect, useState } from "react";
import { Switch, Group, Stack, Text, Card, Box, Tooltip } from "@mantine/core";
import { Activity, Shield, Info } from "lucide-react";
import { t } from "../utils/i18n";

const TRAFFIC_RATE_LIMIT_KEY = "websocket-proxy-traffic-rate-limit";
const DEFAULT_TRAFFIC_RATE_LIMIT = 800;
const MAX_TRAFFIC_RATE_LIMIT = 1000000;

const ControlPanel = ({
  isMonitoring,
  onStartMonitoring,
  onStopMonitoring,
  onBlockChange,
  currentTabId,
}) => {
  const [blockOutgoing, setBlockOutgoing] = useState(false);
  const [blockIncoming, setBlockIncoming] = useState(false);
  const [trafficRateLimit, setTrafficRateLimit] = useState(DEFAULT_TRAFFIC_RATE_LIMIT);
  const [trafficRateLimitDraft, setTrafficRateLimitDraft] = useState(String(DEFAULT_TRAFFIC_RATE_LIMIT));
  const [trafficRateLimitError, setTrafficRateLimitError] = useState(false);

  useEffect(() => {
    let receivedStorageChange = false;
    const updateLimit = (value) => {
      const limit = Number.isSafeInteger(value) && value >= 0 && value <= MAX_TRAFFIC_RATE_LIMIT
        ? value : DEFAULT_TRAFFIC_RATE_LIMIT;
      setTrafficRateLimit(limit);
      setTrafficRateLimitDraft(String(limit));
      setTrafficRateLimitError(false);
    };
    const onStorageChanged = (changes, areaName) => {
      if (areaName === "local" && changes[TRAFFIC_RATE_LIMIT_KEY]) {
        receivedStorageChange = true;
        updateLimit(changes[TRAFFIC_RATE_LIMIT_KEY].newValue);
      }
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    chrome.storage.local.get([TRAFFIC_RATE_LIMIT_KEY], (result) => {
      if (!receivedStorageChange) updateLimit(result[TRAFFIC_RATE_LIMIT_KEY]);
    });
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  const saveTrafficRateLimit = () => {
    const value = trafficRateLimitDraft.trim();
    const limit = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(limit) || limit > MAX_TRAFFIC_RATE_LIMIT) {
      setTrafficRateLimitError(true);
      return;
    }
    setTrafficRateLimitError(false);
    if (limit === trafficRateLimit) {
      setTrafficRateLimitDraft(String(limit));
      return;
    }
    chrome.storage.local.set({ [TRAFFIC_RATE_LIMIT_KEY]: limit }, () => {
      if (chrome.runtime.lastError) {
        setTrafficRateLimitError(true);
      } else {
        setTrafficRateLimit(limit);
        setTrafficRateLimitDraft(String(limit));
      }
    });
  };

  const handleMonitoringToggle = () => {
    if (isMonitoring) {
      onStopMonitoring();
    } else {
      onStartMonitoring();
    }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", padding: "16px", boxSizing: "border-box" }}>
      <Stack gap="sm">
        {/* Monitor Card */}
        <Card
          radius="xl"
          withBorder
          style={{
            background:
              "linear-gradient(135deg, rgba(55, 58, 64, 0.4) 0%, rgba(55, 58, 64, 0.2) 100%)",
            borderColor: "rgba(55, 58, 64, 0.5)",
            padding: "12px",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
          }}
        >
          <Stack gap="10px">
            {/* Header */}
            <Group justify="space-between" align="center">
              <Group align="center" gap="8px">
                <Box
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    background: "rgba(59, 130, 246, 0.2)",
                    border: "1px solid rgba(96, 165, 250, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Activity size={12} color="rgb(96, 165, 250)" />
                </Box>
                <Text size="sm" fw={600} c="rgb(229, 231, 235)">
                  {t("panel.controlPanel.monitor")}
                </Text>
              </Group>
              <Switch
                checked={isMonitoring}
                onChange={handleMonitoringToggle}
                size="sm"
                color="green"
                styles={{
                  track: { cursor: "pointer" },
                  thumb: { cursor: "pointer" },
                }}
              />
            </Group>

            {/* Status */}
            <Group align="center" gap="8px">
              <Box
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isMonitoring
                    ? "rgb(74, 222, 128)"
                    : "rgb(107, 114, 128)",
                  animation: isMonitoring ? "pulse 2s infinite" : "none",
                }}
              />
              <Text size="xs" c="rgb(156, 163, 175)">
                {isMonitoring
                  ? t("panel.controlPanel.status.active")
                  : t("panel.controlPanel.status.inactive")}
              </Text>
            </Group>
            <Group justify="space-between" align="center" gap="4px">
              <Text size="xs" c="rgb(209, 213, 219)">
                {t("panel.controlPanel.trafficRateLimit")}
              </Text>
              <input
                type="number"
                min="0"
                max={MAX_TRAFFIC_RATE_LIMIT}
                step="1"
                value={trafficRateLimitDraft}
                onChange={(event) => {
                  setTrafficRateLimitDraft(event.currentTarget.value);
                  setTrafficRateLimitError(false);
                }}
                onBlur={saveTrafficRateLimit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setTrafficRateLimitDraft(String(trafficRateLimit));
                    setTrafficRateLimitError(false);
                  }
                }}
                aria-label={t("panel.controlPanel.trafficRateLimit")}
                aria-invalid={trafficRateLimitError}
                style={{
                  width: "78px",
                  height: "22px",
                  padding: "0 4px",
                  border: `1px solid ${trafficRateLimitError ? "#ef4444" : "#555"}`,
                  borderRadius: "4px",
                  background: "#2b2d31",
                  color: "#e5e7eb",
                  fontSize: "11px",
                }}
              />
            </Group>
            <Text size="xs" c={trafficRateLimitError ? "red" : "dimmed"}>
              {t(trafficRateLimitError
                ? "panel.controlPanel.trafficRateLimitError"
                : "panel.controlPanel.trafficRateLimitHint")}
            </Text>
          </Stack>
        </Card>
        {/* Message Control Card */}
        <Card
          radius="xl"
          withBorder
          style={{
            background:
              "linear-gradient(135deg, rgba(55, 58, 64, 0.4) 0%, rgba(55, 58, 64, 0.2) 100%)",
            borderColor: "rgba(55, 58, 64, 0.5)",
            padding: "12px",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
          }}
        >
          <Stack gap="8px">
            {/* Header */}
            <Group align="center" gap="8px">
              <Box
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  background: "rgba(249, 115, 22, 0.2)",
                  border: "1px solid rgba(251, 146, 60, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={12} color="rgb(251, 146, 60)" />
              </Box>
              <Text size="sm" fw={600} c="rgb(229, 231, 235)">
                {t("panel.controlPanel.messageControl")}
              </Text>
              <Tooltip
                label={t("panel.controlPanel.messageControlTooltip")}
                arrowSize={6}
                arrowOffset={12}
                zIndex={1600}
                hoverable
                openDelay={100}
                closeDelay={200}
                withinPortal={true}
                styles={{
                  tooltip: {
                    background: "rgba(87, 43, 12, 0.8)",
                    color: "#fb923c",
                    border: "1px solid rgba(251, 146, 60, 0.3)",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.89)",
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                  },
                  arrow: {
                    borderColor: "#f59e0b",
                  },
                }}
              >
                <Info
                  size={12}
                  strokeWidth={2.5}
                  style={{
                    color: "#c28535",
                    cursor: "pointer",
                    verticalAlign: "middle",
                  }}
                />
              </Tooltip>
            </Group>

            {/* Block Options */}
            <Stack gap="2px">
              {/* Block Outgoing */}
              <Group
                justify="space-between"
                align="center"
                style={{ padding: "4px 0" }}
              >
                <Group align="center" gap="8px">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: blockOutgoing
                        ? "rgb(248, 113, 113)"
                        : "rgb(107, 114, 128)",
                    }}
                  />
                  <Text size="xs" c="rgb(209, 213, 219)">
                    {t("panel.controlPanel.blockOutgoing")}
                  </Text>
                </Group>
                <Switch
                  checked={blockOutgoing}
                  onChange={(event) => {
                    const newState = event.currentTarget.checked;
                    setBlockOutgoing(newState);
                    onBlockChange("send", newState);
                    chrome.runtime
                      .sendMessage({
                        type: "block-outgoing",
                        enabled: newState,
                        tabId: currentTabId,
                      })
                      .catch((error) => {
                        // console.error(
                        //   "❌ Failed to toggle outgoing block:",
                        //   error
                        // ); Removed for clean up.
                      });
                  }}
                  size="xs"
                  color="red"
                  styles={{
                    track: { cursor: "pointer" },
                    thumb: { cursor: "pointer" },
                  }}
                  withThumbIndicator={false}
                />
              </Group>

              {/* Block Incoming */}
              <Group
                justify="space-between"
                align="center"
                style={{ padding: "4px 0" }}
              >
                <Group align="center" gap="8px">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: blockIncoming
                        ? "rgb(248, 113, 113)"
                        : "rgb(107, 114, 128)",
                    }}
                  />
                  <Text size="xs" c="rgb(209, 213, 219)">
                    {t("panel.controlPanel.blockIncoming")}
                  </Text>
                </Group>
                <Switch
                  checked={blockIncoming}
                  onChange={(event) => {
                    const newState = event.currentTarget.checked;
                    setBlockIncoming(newState);
                    onBlockChange("receive", newState);
                    chrome.runtime
                      .sendMessage({
                        type: "block-incoming",
                        enabled: newState,
                        tabId: currentTabId,
                      })
                      .catch((error) => {
                        // console.error(
                        //   "❌ Failed to toggle incoming block:",
                        //   error
                        // ); Removed for clean up.
                      });
                  }}
                  size="xs"
                  color="red"
                  styles={{
                    track: { cursor: "pointer" },
                    thumb: { cursor: "pointer" },
                  }}
                  withThumbIndicator={false}
                />
              </Group>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
};

export default ControlPanel;
