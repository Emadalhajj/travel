import { useCallback, useState } from "react";

const emptyDeleteModal = { show: false, id: null, name: "" };

export default function useAdminEntityCrudState({
  prepareForForm,
  prepareClone,
} = {}) {
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formErrors, setFormErrors] = useState({});
  const [loadingSave, setLoadingSave] = useState(false);
  const [deleteModal, setDeleteModal] = useState(emptyDeleteModal);

  const resetForm = useCallback(() => {
    setCurrentItem(null);
    setFormMode("create");
    setFormErrors({});
    setLoadingSave(false);
  }, []);

  const openCreate = useCallback((initialValues = null) => {
    resetForm();
    setCurrentItem(initialValues);
    setShowModal(true);
  }, [resetForm]);

  const openEdit = useCallback(
    (item) => {
      const prepared = prepareForForm ? prepareForForm(item) : item;
      setCurrentItem(prepared);
      setFormMode("edit");
      setFormErrors({});
      setShowModal(true);
    },
    [prepareForForm],
  );

  const openClone = useCallback(
    (item) => {
      const prepared = prepareForForm ? prepareForForm(item) : item;
      const cloned = prepareClone
        ? prepareClone(item, prepared)
        : { ...prepared, _id: null };
      setCurrentItem(cloned);
      setFormMode("clone");
      setFormErrors({});
      setShowModal(true);
    },
    [prepareClone, prepareForForm],
  );

  const openDetails = useCallback((item) => {
    setCurrentItem(item);
    setShowDetails(true);
  }, []);

  const openDelete = useCallback((item, name = "") => {
    setDeleteModal({
      show: true,
      id: item?._id || item?.id || item,
      name,
    });
  }, []);

  const closeForm = useCallback(() => setShowModal(false), []);
  const closeDetails = useCallback(() => setShowDetails(false), []);
  const closeDelete = useCallback(
    () => setDeleteModal(emptyDeleteModal),
    [],
  );

  return {
    showModal,
    showDetails,
    currentItem,
    formMode,
    formErrors,
    loadingSave,
    deleteModal,
    openCreate,
    openEdit,
    openClone,
    openDetails,
    openDelete,
    closeForm,
    closeDetails,
    closeDelete,
    resetForm,
    setFormErrors,
    setLoadingSave,
  };
}
