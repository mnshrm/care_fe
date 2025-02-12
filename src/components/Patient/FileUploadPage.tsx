import Page from "@/components/Common/Page";
import { FileUpload } from "@/components/Files/FileUpload";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

export default function FileUploadPage(props: {
  facilityId: string;
  patientId: string;
  encounterId?: string;
  type: "encounter" | "patient";
}) {
  const { facilityId, patientId, encounterId, type } = props;
  const { data: patient } = useTanStackQueryInstead(routes.getPatient, {
    pathParams: { id: patientId },
    prefetch: !!patientId,
  });
  return (
    <Page
      hideBack={false}
      title="Patient Files"
      crumbsReplacements={{
        [facilityId]: { name: patient?.facility_object?.name },
        [patientId]: { name: patient?.name },
      }}
      backUrl={
        type === "encounter"
          ? `/facility/${facilityId}/encounter/${encounterId}`
          : `/facility/${facilityId}/patient/${patientId}`
      }
    >
      <FileUpload
        patientId={patientId}
        encounterId={encounterId}
        type={type}
        allowAudio={true}
      />
    </Page>
  );
}
