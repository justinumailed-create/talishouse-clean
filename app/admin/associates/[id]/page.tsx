import AssociateEditForm from "@/components/admin/AssociateEditForm";

export default async function EditAssociatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AssociateEditForm id={id} />;
}
