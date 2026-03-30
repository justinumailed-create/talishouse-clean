"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase, User } from "@/lib/supabase";
import { getFastCode, setFastCode } from "@/lib/fast-code";

const ASSOCIATE_STORAGE_KEY = "talishouse_associate";

interface AssociateInfo {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  fastCode: string;
  introMessage: string | null;
  images: string[];
}

interface AssociateContextType {
  associate: AssociateInfo | null;
  fastCode: string;
  associateId: string | null;
  isLoading: boolean;
  isAssociatePage: boolean;
  refreshAssociate: () => Promise<void>;
}

const AssociateContext = createContext<AssociateContextType | undefined>(undefined);

export function AssociateProvider({ children }: { children: ReactNode }) {
  const [associate, setAssociate] = useState<AssociateInfo | null>(null);
  const [fastCode, setFastCodeState] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isAssociatePage = !!fastCode;

  const fetchAssociate = useCallback(async (code: string) => {
    if (!code) {
      setAssociate(null);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("id, name, phone, email, fast_code, intro_message, images")
      .eq("fast_code", code.toUpperCase())
      .eq("role", "associate")
      .maybeSingle();

    if (data) {
      const info: AssociateInfo = {
        id: data.id,
        name: data.name || "Associate",
        phone: data.phone,
        email: data.email,
        fastCode: data.fast_code || code,
        introMessage: data.intro_message,
        images: data.images || [],
      };
      setAssociate(info);
      
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(ASSOCIATE_STORAGE_KEY, JSON.stringify(info));
        } catch (e) {
          console.error("Failed to cache associate info:", e);
        }
      }
    } else {
      setAssociate(null);
    }
  }, []);

  const refreshAssociate = useCallback(async () => {
    const code = fastCode || getFastCode();
    if (code) {
      await fetchAssociate(code);
    }
  }, [fastCode, fetchAssociate]);

  useEffect(() => {
    const storedCode = getFastCode();
    
    if (storedCode) {
      setFastCodeState(storedCode);
      fetchAssociate(storedCode);
    } else {
      const cached = localStorage.getItem(ASSOCIATE_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setAssociate(parsed);
          setFastCodeState(parsed.fastCode);
        } catch {
          localStorage.removeItem(ASSOCIATE_STORAGE_KEY);
        }
      }
    }
    
    setIsLoading(false);
  }, [fetchAssociate]);

  return (
    <AssociateContext.Provider
      value={{
        associate,
        fastCode,
        associateId: associate?.id || null,
        isLoading,
        isAssociatePage,
        refreshAssociate,
      }}
    >
      {children}
    </AssociateContext.Provider>
  );
}

export function useAssociate() {
  const context = useContext(AssociateContext);
  if (!context) {
    return {
      associate: null,
      fastCode: "",
      associateId: null,
      isLoading: false,
      isAssociatePage: false,
      refreshAssociate: async () => {},
    };
  }
  return context;
}
