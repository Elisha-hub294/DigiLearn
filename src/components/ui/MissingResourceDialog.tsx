import { useState } from "react";
import { auth } from "../../../firebaseConfig";
import {
  getReportErrorMessage,
  submitReport,
} from "../../services/reportService";
import { ActionDialog } from "./ActionDialog";
import { ReportDialog } from "./ReportDialog";

type MissingResourceDialogProps = {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  onGoBack: () => void;
};

export function MissingResourceDialog({
  resourceType,
  resourceId,
  resourceName,
  onGoBack,
}: MissingResourceDialogProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);

  const handleSubmitReport = async (reasons: string[], details: string) => {
    if (!auth.currentUser) {
      setReportError("Please log in before sending a report.");
      return;
    }

    setReportSubmitting(true);
    setReportError(null);
    try {
      await submitReport({
        reasons,
        details,
        item: { type: resourceType, id: resourceId, name: resourceName },
      });
      setShowReportDialog(false);
      setReportSent(true);
    } catch (error) {
      console.error("Failed to submit missing resource report", error);
      setReportError(getReportErrorMessage(error));
    } finally {
      setReportSubmitting(false);
    }
  };

  const reportDialogVisible = showReportDialog && !reportSent;

  return (
    <>
      <ActionDialog
        visible={!showReportDialog && !reportSent}
        title="Resource unavailable"
        message="This resource may have been deleted or is no longer available. Please go back and try another resource, or report the problem so we can investigate."
        primaryText="Report problem"
        secondaryText="Go back"
        onPrimary={() => {
          setReportError(null);
          setShowReportDialog(true);
        }}
        onSecondary={onGoBack}
      />
      <ReportDialog
        visible={reportDialogVisible}
        itemName={resourceName}
        submitting={reportSubmitting}
        error={reportError}
        onSubmit={handleSubmitReport}
        onClose={() => setShowReportDialog(false)}
      />
      <ActionDialog
        visible={reportSent}
        title="Report sent"
        message="Thanks. We will review this resource and investigate why it is unavailable."
        primaryText="Done"
        onPrimary={onGoBack}
        onClose={onGoBack}
      />
    </>
  );
}
