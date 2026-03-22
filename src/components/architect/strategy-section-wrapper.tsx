"use client";

import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";

interface StrategySectionWrapperProps {
  id: string;
  title: string;
  icon: LucideIcon;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function StrategySectionWrapper({ id, title, icon: Icon, description, children, defaultOpen = true }: StrategySectionWrapperProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </CollapsibleTrigger>
        {description && <p className="text-sm text-muted-foreground mt-1 ml-11">{description}</p>}
        <CollapsibleContent className={cn("mt-3", open && "border-l-2 border-primary/20 pl-4")}>
          {children}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
