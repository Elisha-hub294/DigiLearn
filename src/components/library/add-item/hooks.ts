import { useCallback, useEffect, useState } from "react";
import { FormState, INITIAL_FORM_STATE } from "./constants";
import { fetchPastPaperTypes, fetchSubjects } from "./firebaseService";

/**
 * Custom hook for managing form state
 */
export const useFormState = (initialState = INITIAL_FORM_STATE) => {
  const [formData, setFormData] = useState<FormState>(initialState);

  const updateField = useCallback(
    (key: keyof FormState, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);

  return { formData, updateField, resetForm, setFormData };
};

/**
 * Custom hook for managing upload progress
 */
export const useUploadProgress = () => {
  const [uploadProgress, setUploadProgress] = useState<{
    active: boolean;
    label: string;
    progress: number;
  }>({ active: false, label: "Uploading", progress: 0 });

  const startUpload = useCallback((label: string) => {
    setUploadProgress({ active: true, label, progress: 0 });
  }, []);

  const updateProgress = useCallback((label: string, progress: number) => {
    setUploadProgress({ active: true, label, progress });
  }, []);

  const completeUpload = useCallback((label: string) => {
    setUploadProgress({ active: true, label, progress: 100 });
  }, []);

  const resetProgress = useCallback(() => {
    setUploadProgress({ active: false, label: "Uploading", progress: 0 });
  }, []);

  return {
    uploadProgress,
    startUpload,
    updateProgress,
    completeUpload,
    resetProgress,
    setUploadProgress,
  };
};

/**
 * Custom hook for managing dropdown states
 */
export const useDropdowns = () => {
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  return {
    levelDropdownOpen,
    setLevelDropdownOpen,
    classDropdownOpen,
    setClassDropdownOpen,
    subjectDropdownOpen,
    setSubjectDropdownOpen,
    typeDropdownOpen,
    setTypeDropdownOpen,
  };
};

/**
 * Custom hook for fetching subjects and paper types
 */
export const useFormOptions = (
  formType: "book" | "banner" | "paper" | "page",
  visible: boolean,
) => {
  const [subjects, setSubjects] = useState<
    {
      id: string;
      name: string;
      ordinary?: string;
      advanced?: string;
      ordinaryPapers?: number;
      advancedPapers?: number;
    }[]
  >([]);
  const [pastPaperTypes, setPastPaperTypes] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    const loadOptions = async () => {
      if (
        (formType === "book" ||
          formType === "page" ||
          formType === "paper" ||
          formType === "banner") &&
        visible
      ) {
        const subjectList = await fetchSubjects();
        setSubjects(subjectList);
      }

      if (formType === "paper" && visible) {
        const typeList = await fetchPastPaperTypes();
        setPastPaperTypes(typeList);
      }
    };

    loadOptions();
  }, [formType, visible]);

  return { subjects, pastPaperTypes };
};

/**
 * Custom hook for managing status dialogs
 */
export const useStatusDialog = () => {
  const [statusDialog, setStatusDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    primaryText: string;
    secondaryText?: string;
    onPrimary: () => void;
    onSecondary?: () => void;
  } | null>(null);

  const showStatusDialog = useCallback(
    (
      title: string,
      message: string,
      primaryText: string,
      onPrimary: () => void,
      secondaryText?: string,
      onSecondary?: () => void,
    ) => {
      setStatusDialog({
        visible: true,
        title,
        message,
        primaryText,
        secondaryText,
        onPrimary,
        onSecondary,
      });
    },
    [],
  );

  const closeStatusDialog = useCallback(() => {
    setStatusDialog(null);
  }, []);

  return { statusDialog, setStatusDialog, showStatusDialog, closeStatusDialog };
};

/**
 * Custom hook for managing info messages
 */
export const useInfoMessage = () => {
  const [infoMessage, setInfoMessage] = useState<string>("");

  const clearInfoMessage = useCallback(() => {
    setInfoMessage("");
  }, []);

  return { infoMessage, setInfoMessage, clearInfoMessage };
};

/**
 * Custom hook for managing year picker
 */
export const useYearPicker = () => {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const currentYear = new Date().getFullYear();

  const getYearPickerDate = (year: string | number): Date => {
    const numYear = typeof year === "string" ? parseInt(year, 10) : year;
    return new Date(numYear || currentYear, 0, 1);
  };

  return { showYearPicker, setShowYearPicker, currentYear, getYearPickerDate };
};

/**
 * Custom hook for managing PDF processing state
 */
export const usePdfProcessing = () => {
  const [pdfToProcess, setPdfToProcess] = useState<{
    base64Data: string;
    resolve: (value: any) => void;
    reject: (err: any) => void;
    mode?: "cover" | "pageCount";
  } | null>(null);

  const clearPdfProcess = useCallback(() => {
    setPdfToProcess(null);
  }, []);

  return { pdfToProcess, setPdfToProcess, clearPdfProcess };
};
