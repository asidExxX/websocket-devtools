import React, { useEffect, useRef, useState } from "react";
import { LoaderCircle, Send, Settings, Sparkles, Square, Trash2, Wrench, X } from "lucide-react";
import { t } from "../utils/i18n.js";
import {
  AI_CONFIG_STORAGE_KEY,
  DEFAULT_MAX_TOOL_CALLS,
  buildAnalysisContext,
  buildChatMessages,
  getChatCompletionsUrl,
  parseMaxToolCalls,
  runAiAnalysis,
} from "../utils/aiAssistant.js";

const DEFAULT_CONFIG = { baseUrl: "https://api.openai.com/v1", apiKey: "", modelId: "", maxToolCalls: DEFAULT_MAX_TOOL_CALLS };

function errorText(error) {
  const key = `ai.errors.${error?.message}`;
  const translated = t(key);
  return translated === key ? (error?.message || t("ai.errors.requestFailed")) : translated;
}

function toolLabel(item) {
  if (item.name === "read_messages") return t(item.result?.scope === "filtered" || item.args?.scope === "filtered" ? "ai.tool.filtered" : "ai.tool.visible");
  if (item.name === "list_websocket_connections") return t("ai.tool.connections");
  if (item.name === "read_connection_messages") return t("ai.tool.connectionMessages");
  if (item.name === "read_page") return t(item.result?.mode === "html" || item.args?.mode === "html" ? "ai.tool.pageCode" : "ai.tool.pageText");
  if (item.name === "inspect_page_resources") return t("ai.tool.resources");
  if (item.name === "list_network_requests") return t("ai.tool.networkList");
  if (item.name === "get_network_request") return t("ai.tool.networkDetail");
  return t("ai.tool.network");
}

function toolResultSummary(item) {
  if (item.status === "running") return t("ai.toolStatus.running");
  if (item.status === "stopped") return t("ai.toolStatus.stopped");
  if (item.result?.error) return `${t("ai.toolStatus.failed")}: ${errorText(new Error(item.result.error))}`;
  if (item.status === "cached") return t("ai.toolStatus.cached");
  const result = item.result || {};
  if (Array.isArray(result.entries)) return t("ai.toolStatus.entries", { count: result.entries.length, total: result.matched ?? result.total ?? result.entries.length });
  if (Array.isArray(result.connections)) return t("ai.toolStatus.entries", { count: result.connections.length, total: result.matched ?? result.total ?? result.connections.length });
  if (Array.isArray(result.urls)) return t("ai.toolStatus.entries", { count: result.urls.length, total: result.total ?? result.urls.length });
  if (typeof result.content === "string") return t("ai.toolStatus.characters", { count: result.content.length });
  return t("ai.toolStatus.complete");
}

const ToolTrace = ({ items }) => items.length > 0 && (
  <div className="ai-tool-trace" aria-label={t("ai.toolTrace")}>
    <div className="ai-tool-trace-title"><Wrench size={12} />{t("ai.toolTrace")} · {items.length}</div>
    <div className="ai-tool-trace-list">
      {items.map(item => (
        <div className={`ai-tool-row ${item.status}`} key={item.id} title={JSON.stringify(item.args || {}).slice(0, 500)}>
          <span className="ai-tool-dot" />
          <span className="ai-tool-name">{toolLabel(item)}</span>
          <span className="ai-tool-result">{toolResultSummary(item)}</span>
        </div>
      ))}
    </div>
  </div>
);

const AiAssistant = ({ hidden = false, connection, selectedMessage, getMessageView, getWorkspaceSnapshot, onClose }) => {
  const [config, setConfig] = useState(null);
  const [draftConfig, setDraftConfig] = useState(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState([]);
  const [activeTools, setActiveTools] = useState([]);
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);
  const requestVersionRef = useRef(0);
  const conversationEndRef = useRef(null);

  useEffect(() => {
    let active = true;
    chrome.storage.local.get(AI_CONFIG_STORAGE_KEY).then(result => {
      if (!active) return;
      const saved = result?.[AI_CONFIG_STORAGE_KEY];
      if (saved && typeof saved === "object") {
        let maxToolCalls = DEFAULT_MAX_TOOL_CALLS;
        try {
          if (saved.maxToolCalls != null) maxToolCalls = parseMaxToolCalls(saved.maxToolCalls);
        } catch {
          // Use the default for invalid values from an older extension version.
        }
        const next = {
          baseUrl: String(saved.baseUrl || DEFAULT_CONFIG.baseUrl),
          apiKey: String(saved.apiKey || ""),
          modelId: String(saved.modelId || ""),
          maxToolCalls,
        };
        setConfig(next);
        setDraftConfig(next);
        setShowSettings(!next.modelId);
      } else {
        setShowSettings(true);
      }
    }).catch(() => {
      if (active) setSettingsError(t("ai.errors.storageFailed"));
    });
    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, activeTools, loading, hidden]);

  const handleSave = async () => {
    try {
      getChatCompletionsUrl(draftConfig.baseUrl);
      if (!draftConfig.modelId.trim()) throw new Error("missingModelId");
      const next = {
        baseUrl: draftConfig.baseUrl.trim(),
        apiKey: draftConfig.apiKey.trim(),
        modelId: draftConfig.modelId.trim(),
        maxToolCalls: parseMaxToolCalls(draftConfig.maxToolCalls),
      };
      await chrome.storage.local.set({ [AI_CONFIG_STORAGE_KEY]: next });
      setConfig(next);
      setSettingsError("");
      setShowSettings(false);
    } catch (error) {
      setSettingsError(errorText(error));
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setActiveTools(previous => previous.map(item => item.status === "running" ? { ...item, status: "stopped" } : item));
  };

  const handleClear = () => {
    requestVersionRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setTurns([]);
    setActiveTools([]);
    setQuestion("");
    setRequestError("");
    setLoading(false);
  };

  const handleSend = async () => {
    if (loading || !config) {
      setShowSettings(true);
      return;
    }

    const prompt = question.trim() || t("ai.defaultQuestion");
    setRequestError("");
    setLoading(true);
    const controller = new AbortController();
    const requestVersion = ++requestVersionRef.current;
    abortRef.current = controller;
    let timedOut = false;
    let userTurnAdded = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 120000);

    try {
      const currentView = getMessageView?.();
      const messageView = currentView?.connectionId === connection?.id
        ? currentView
        : { visibleMessages: connection?.messages || [], filteredMessages: [] };
      const workspace = getWorkspaceSnapshot?.() || {};
      const toolContext = {
        ...messageView,
        connections: workspace.connections || [],
        events: workspace.events || [],
      };
      const context = buildAnalysisContext({
        connection,
        selectedMessage,
        messageView,
        connectionCount: toolContext.connections.length,
      });
      const messages = buildChatMessages(turns, prompt, context);
      setTurns(previous => [...previous, { role: "user", content: prompt }]);
      userTurnAdded = true;
      setQuestion("");
      setActiveTools([]);
      const runTools = [];
      const answer = await runAiAnalysis(config, messages, toolContext, {
        signal: controller.signal,
        onToolCall: item => {
          if (requestVersionRef.current !== requestVersion) return;
          const existing = runTools.findIndex(tool => tool.id === item.id);
          if (existing >= 0) runTools[existing] = item;
          else runTools.push(item);
          setActiveTools([...runTools]);
        },
      });
      if (requestVersionRef.current !== requestVersion) return;
      setTurns(previous => [...previous, { role: "assistant", content: answer, tools: [...runTools] }]);
      setActiveTools([]);
    } catch (error) {
      if (requestVersionRef.current !== requestVersion) return;
      if (userTurnAdded) {
        setTurns(previous => previous.slice(0, -1));
        setQuestion(prompt);
      }
      if (error?.name !== "AbortError") setRequestError(errorText(error));
      else if (timedOut) {
        setRequestError(t("ai.errors.requestTimeout"));
        setActiveTools(previous => previous.map(item => item.status === "running" ? { ...item, status: "error", result: { error: "requestTimeout" } } : item));
      }
    } finally {
      clearTimeout(timeout);
      if (requestVersionRef.current === requestVersion) {
        if (abortRef.current === controller) abortRef.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <aside className="ai-sidebar" aria-label={t("ai.title")} hidden={hidden}>
      <div className="ai-panel">
        <header className="ai-header">
          <div className="ai-title"><Sparkles size={18} /><span>{t("ai.title")}</span></div>
          <div className="ai-header-actions">
            <button type="button" onClick={handleClear} title={t("ai.clear")} aria-label={t("ai.clear")} disabled={!loading && turns.length === 0 && !question}><Trash2 size={16} /></button>
            <button type="button" onClick={() => setShowSettings(value => !value)} title={t("ai.settings")} aria-label={t("ai.settings")}><Settings size={17} /></button>
            <button type="button" onClick={onClose} title={t("common.close")} aria-label={t("common.close")}><X size={18} /></button>
          </div>
        </header>

        {showSettings && (
          <section className="ai-settings" aria-label={t("ai.settings")}>
            <p className="ai-hint">{t("ai.compatibilityHint")}</p>
            <label>{t("ai.baseUrl")}
              <input type="url" spellCheck={false} value={draftConfig.baseUrl} onChange={event => setDraftConfig(value => ({ ...value, baseUrl: event.target.value }))} placeholder="https://api.openai.com/v1" />
            </label>
            <label>{t("ai.apiKey")}
              <input type="password" autoComplete="off" spellCheck={false} value={draftConfig.apiKey} onChange={event => setDraftConfig(value => ({ ...value, apiKey: event.target.value }))} placeholder={t("ai.apiKeyPlaceholder")} />
            </label>
            <label>{t("ai.modelId")}
              <input type="text" spellCheck={false} value={draftConfig.modelId} onChange={event => setDraftConfig(value => ({ ...value, modelId: event.target.value }))} placeholder={t("ai.modelIdPlaceholder")} />
            </label>
            <label>{t("ai.maxToolCalls")}
              <input type="number" min="0" step="1" value={draftConfig.maxToolCalls} onChange={event => setDraftConfig(value => ({ ...value, maxToolCalls: event.target.value }))} />
            </label>
            <p className="ai-hint">{t("ai.maxToolCallsHint")}</p>
            <p className="ai-hint">{t("ai.keyStorageHint")}</p>
            {draftConfig.apiKey && draftConfig.baseUrl.trim().startsWith("http:") && <p className="ai-error">{t("ai.httpWarning")}</p>}
            {settingsError && <p className="ai-error" role="alert">{settingsError}</p>}
            <button type="button" className="ai-primary" onClick={handleSave}>{t("common.save")}</button>
          </section>
        )}

        <div className="ai-conversation">
          {turns.length === 0 && (
            <div className="ai-empty">
              <Sparkles size={27} />
              <p>{t("ai.intro")}</p>
              <div className="ai-quick-prompts">
                {["disconnect", "protocol", "auth", "heartbeat"].map(key => (
                  <button type="button" key={key} onClick={() => setQuestion(t(`ai.quick.${key}`))}>{t(`ai.quick.${key}`)}</button>
                ))}
              </div>
            </div>
          )}
          {turns.map((turn, index) => (
            <div className={`ai-turn ${turn.role}`} key={index}>
              <span className="ai-turn-label">{turn.role === "assistant" ? t("ai.title") : t("ai.you")}</span>
              {turn.role === "assistant" && <ToolTrace items={turn.tools || []} />}
              <div className="ai-turn-content">{turn.content}</div>
            </div>
          ))}
          {activeTools.length > 0 && <ToolTrace items={activeTools} />}
          {loading && <div className="ai-loading"><LoaderCircle size={15} />{activeTools.some(item => item.status === "running") ? t("ai.readingTools") : t("ai.analyzing")}</div>}
          <div ref={conversationEndRef} />
        </div>

        <div className="ai-compose">
          <p className="ai-context-note">{t("ai.autoContextHint")}</p>
          {selectedMessage && <p className="ai-context-note">{t("ai.selectedMessageIncluded")}</p>}
          {!connection && <p className="ai-context-note">{t("ai.noConnection")}</p>}
          {requestError && <p className="ai-error" role="alert">{requestError}</p>}
          <div className="ai-compose-row">
            <textarea value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
                event.preventDefault();
                handleSend();
              }
            }} placeholder={t("ai.questionPlaceholder")} rows={2} />
            <button type="button" className={`ai-primary ai-send${loading ? " stop" : ""}`} disabled={!loading && !config} onClick={loading ? handleStop : handleSend} title={t(loading ? "ai.stop" : "ai.send")} aria-label={t(loading ? "ai.stop" : "ai.send")}>
              {loading ? <Square size={15} fill="currentColor" /> : <Send size={17} />}
            </button>
          </div>
          <p className="ai-hint">{t("ai.sendHint")}</p>
        </div>
      </div>
    </aside>
  );
};

export default AiAssistant;
