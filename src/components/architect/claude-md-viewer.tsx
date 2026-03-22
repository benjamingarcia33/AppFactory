"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import type { AnalysisDocument } from "@/lib/types";

interface ClaudeMdViewerProps {
  claudeMdDoc: AnalysisDocument;
  mcpJsonDoc: AnalysisDocument | null;
  envExampleDoc: AnalysisDocument | null;
  claudeCommandsDoc: AnalysisDocument | null;
  claudeAgentsDoc: AnalysisDocument | null;
  buildStrategyDoc: AnalysisDocument | null;
  claudeSettingsDoc: AnalysisDocument | null;
  claudeSkillsDoc: AnalysisDocument | null;
}

export function ClaudeMdViewer({ claudeMdDoc, mcpJsonDoc, envExampleDoc, claudeCommandsDoc, claudeAgentsDoc, buildStrategyDoc, claudeSettingsDoc, claudeSkillsDoc }: ClaudeMdViewerProps) {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState<Record<string, boolean>>({});
  const [agentsOpen, setAgentsOpen] = useState<Record<string, boolean>>({});
  const [skillsOpen, setSkillsOpen] = useState<Record<string, boolean>>({});
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCopy = useCallback(async (content: string, fileKey: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedFile(fileKey);
    setTimeout(() => setCopiedFile(null), 2000);
  }, []);

  const handleDownload = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Parse commands JSON into individual command files
  const commandFiles = useMemo(() => {
    if (!claudeCommandsDoc) return null;
    try {
      return JSON.parse(claudeCommandsDoc.content) as Record<string, string>;
    } catch {
      return null;
    }
  }, [claudeCommandsDoc]);

  // Parse agents JSON into individual agent files
  const agentFiles = useMemo(() => {
    if (!claudeAgentsDoc) return null;
    try {
      return JSON.parse(claudeAgentsDoc.content) as Record<string, string>;
    } catch {
      return null;
    }
  }, [claudeAgentsDoc]);

  // Parse skills JSON into individual skill files
  const skillFiles = useMemo(() => {
    if (!claudeSkillsDoc) return null;
    try {
      return JSON.parse(claudeSkillsDoc.content) as Record<string, string>;
    } catch {
      return null;
    }
  }, [claudeSkillsDoc]);

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-4 space-y-6">
      <h2 className="text-lg font-semibold">Project Configuration Files</h2>

      {/* Info banner */}
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-yellow-400/80">
            <p className="font-medium mb-1">Place all files in your project root. Fill in .env after running Prompt 1.</p>
            <p>
              <strong>CLAUDE.md</strong> configures Claude Code.{" "}
              <strong>.mcp.json</strong> connects MCP servers.{" "}
              <strong>.env.example</strong> documents all required API keys.{" "}
              <strong>commands/</strong> adds slash commands.{" "}
              <strong>agents/</strong> defines build subagents.{" "}
              <strong>skills/</strong> bundles project-specific context.{" "}
              <strong>BUILD_STRATEGY.md</strong> documents the phased build workflow.{" "}
              <strong>settings.json</strong> enables agent teams.
            </p>
          </div>
        </div>
      </div>

      {/* CLAUDE.md section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">CLAUDE.md</h3>
            <p className="text-xs text-muted-foreground">Project context and conventions for Claude Code</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={copiedFile === "claude_md" ? "default" : "outline"}
              onClick={() => handleCopy(claudeMdDoc.content, "claude_md")}
            >
              {copiedFile === "claude_md" ? "Copied!" : "Copy"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(claudeMdDoc.content, "CLAUDE.md")}
            >
              Download
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="prose prose-sm prose-invert max-w-none pr-4">
            <ReactMarkdown>{claudeMdDoc.content}</ReactMarkdown>
          </div>
        </ScrollArea>
      </div>

      {/* .env.example section */}
      {envExampleDoc && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">.env.example</h3>
              <p className="text-xs text-muted-foreground">Environment variable template — copy to .env and fill in your keys</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={copiedFile === "env_example" ? "default" : "outline"}
                onClick={() => handleCopy(envExampleDoc.content, "env_example")}
              >
                {copiedFile === "env_example" ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(envExampleDoc.content, ".env.example")}
              >
                Download
              </Button>
            </div>
          </div>
          <Collapsible open={envOpen} onOpenChange={setEnvOpen}>
            <CollapsibleTrigger className="text-xs text-primary hover:underline">
              {envOpen ? "Hide contents" : "Show contents"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[300px] mt-2">
                <pre className="text-xs bg-surface-1 rounded-lg p-4 overflow-x-auto">
                  <code>{envExampleDoc.content}</code>
                </pre>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
          {!envOpen && (
            <pre className="text-xs text-muted-foreground bg-surface-1 rounded p-2 overflow-hidden max-h-24 line-clamp-5">
              {envExampleDoc.content.split("\n").slice(0, 8).join("\n")}
            </pre>
          )}
        </div>
      )}

      {/* .mcp.json section */}
      {mcpJsonDoc && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">.mcp.json</h3>
              <p className="text-xs text-muted-foreground">MCP server configuration for external service access</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={copiedFile === "mcp_json" ? "default" : "outline"}
                onClick={() => handleCopy(mcpJsonDoc.content, "mcp_json")}
              >
                {copiedFile === "mcp_json" ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(mcpJsonDoc.content, ".mcp.json")}
              >
                Download
              </Button>
            </div>
          </div>
          <Collapsible open={mcpOpen} onOpenChange={setMcpOpen}>
            <CollapsibleTrigger className="text-xs text-primary hover:underline">
              {mcpOpen ? "Hide JSON" : "Show JSON"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[300px] mt-2">
                <pre className="text-xs bg-surface-1 rounded-lg p-4 overflow-x-auto">
                  <code>{mcpJsonDoc.content}</code>
                </pre>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
          {!mcpOpen && (
            <pre className="text-xs text-muted-foreground bg-surface-1 rounded p-2 overflow-hidden max-h-24 line-clamp-5">
              {mcpJsonDoc.content.split("\n").slice(0, 8).join("\n")}
            </pre>
          )}
        </div>
      )}

      {/* Claude Commands section */}
      {commandFiles && Object.keys(commandFiles).length > 0 && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">.claude/commands/</h3>
              <p className="text-xs text-muted-foreground">Claude Code slash commands for build verification</p>
            </div>
            <Button
              size="sm"
              variant={copiedFile === "all_commands" ? "default" : "outline"}
              onClick={() => handleCopy(claudeCommandsDoc!.content, "all_commands")}
            >
              {copiedFile === "all_commands" ? "Copied!" : "Copy All"}
            </Button>
          </div>
          <div className="space-y-2">
            {Object.entries(commandFiles).map(([filename, content]) => (
              <Collapsible
                key={filename}
                open={commandsOpen[filename] ?? false}
                onOpenChange={(open) => setCommandsOpen(prev => ({ ...prev, [filename]: open }))}
              >
                <div className="flex items-center justify-between bg-surface-1 rounded-md px-3 py-2">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-mono hover:text-primary">
                    <span className="text-muted-foreground">{commandsOpen[filename] ? "v" : ">"}</span>
                    {filename}
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleCopy(content, `cmd_${filename}`)}
                    >
                      {copiedFile === `cmd_${filename}` ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleDownload(content, filename)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="prose prose-sm prose-invert max-w-none mt-2 ml-4">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      )}

      {/* .claude/agents/ section */}
      {agentFiles && Object.keys(agentFiles).length > 0 && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">.claude/agents/</h3>
              <p className="text-xs text-muted-foreground">Specialized subagent definitions for phased builds</p>
            </div>
            <Button
              size="sm"
              variant={copiedFile === "all_agents" ? "default" : "outline"}
              onClick={() => handleCopy(claudeAgentsDoc!.content, "all_agents")}
            >
              {copiedFile === "all_agents" ? "Copied!" : "Copy All"}
            </Button>
          </div>
          <div className="space-y-2">
            {Object.entries(agentFiles).map(([filename, content]) => (
              <Collapsible
                key={filename}
                open={agentsOpen[filename] ?? false}
                onOpenChange={(open) => setAgentsOpen(prev => ({ ...prev, [filename]: open }))}
              >
                <div className="flex items-center justify-between bg-surface-1 rounded-md px-3 py-2">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-mono hover:text-primary">
                    <span className="text-muted-foreground">{agentsOpen[filename] ? "v" : ">"}</span>
                    {filename}
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleCopy(content, `agent_${filename}`)}
                    >
                      {copiedFile === `agent_${filename}` ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleDownload(content, filename)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="prose prose-sm prose-invert max-w-none mt-2 ml-4">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      )}

      {/* .claude/skills/ section */}
      {skillFiles && Object.keys(skillFiles).length > 0 && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">.claude/skills/</h3>
              <p className="text-xs text-muted-foreground">Project-specific bundled skills that auto-load based on context</p>
            </div>
            <Button
              size="sm"
              variant={copiedFile === "all_skills" ? "default" : "outline"}
              onClick={() => handleCopy(claudeSkillsDoc!.content, "all_skills")}
            >
              {copiedFile === "all_skills" ? "Copied!" : "Copy All"}
            </Button>
          </div>
          <div className="space-y-2">
            {Object.entries(skillFiles).map(([filepath, content]) => (
              <Collapsible
                key={filepath}
                open={skillsOpen[filepath] ?? false}
                onOpenChange={(open) => setSkillsOpen(prev => ({ ...prev, [filepath]: open }))}
              >
                <div className="flex items-center justify-between bg-surface-1 rounded-md px-3 py-2">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-mono hover:text-primary">
                    <span className="text-muted-foreground">{skillsOpen[filepath] ? "v" : ">"}</span>
                    {filepath}
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleCopy(content, `skill_${filepath}`)}
                    >
                      {copiedFile === `skill_${filepath}` ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleDownload(content, filepath.split("/").pop() ?? filepath)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="prose prose-sm prose-invert max-w-none mt-2 ml-4">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      )}

      {/* BUILD_STRATEGY.md section */}
      {buildStrategyDoc && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">BUILD_STRATEGY.md</h3>
              <p className="text-xs text-muted-foreground">Phased build workflow with agent invocation instructions</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={copiedFile === "build_strategy" ? "default" : "outline"}
                onClick={() => handleCopy(buildStrategyDoc.content, "build_strategy")}
              >
                {copiedFile === "build_strategy" ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(buildStrategyDoc.content, "BUILD_STRATEGY.md")}
              >
                Download
              </Button>
            </div>
          </div>
          <Collapsible open={strategyOpen} onOpenChange={setStrategyOpen}>
            <CollapsibleTrigger className="text-xs text-primary hover:underline">
              {strategyOpen ? "Hide contents" : "Show contents"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[400px] mt-2">
                <div className="prose prose-sm prose-invert max-w-none pr-4">
                  <ReactMarkdown>{buildStrategyDoc.content}</ReactMarkdown>
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
          {!strategyOpen && (
            <pre className="text-xs text-muted-foreground bg-surface-1 rounded p-2 overflow-hidden max-h-24 line-clamp-5">
              {buildStrategyDoc.content.split("\n").slice(0, 8).join("\n")}
            </pre>
          )}
        </div>
      )}

      {/* settings.json section */}
      {claudeSettingsDoc && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">.claude/settings.json</h3>
              <p className="text-xs text-muted-foreground">Agent teams enablement and build permission pre-approvals</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={copiedFile === "claude_settings" ? "default" : "outline"}
                onClick={() => handleCopy(claudeSettingsDoc.content, "claude_settings")}
              >
                {copiedFile === "claude_settings" ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(claudeSettingsDoc.content, "settings.json")}
              >
                Download
              </Button>
            </div>
          </div>
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="text-xs text-primary hover:underline">
              {settingsOpen ? "Hide JSON" : "Show JSON"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[200px] mt-2">
                <pre className="text-xs bg-surface-1 rounded-lg p-4 overflow-x-auto">
                  <code>{claudeSettingsDoc.content}</code>
                </pre>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
          {!settingsOpen && (
            <pre className="text-xs text-muted-foreground bg-surface-1 rounded p-2 overflow-hidden max-h-24 line-clamp-5">
              {claudeSettingsDoc.content.split("\n").slice(0, 8).join("\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
