import { useState } from 'react';

export function useTimePicker(onUpdateFlight) {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    fieldKey: null,
    title: '',
    initialValue: ''
  });

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const handleFieldClick = (fieldKey, title, currentValue) => {
    if (!currentValue || currentValue === '--:--') {
      // Si está vacío, toma la hora inmediata
      onUpdateFlight(fieldKey, getCurrentTime());
    } else {
      // Si ya tiene valor, abre el modal para edición manual
      setModalConfig({
        isOpen: true,
        fieldKey,
        title,
        initialValue: currentValue
      });
    }
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const saveModalTime = (selectedTime) => {
    if (modalConfig.fieldKey) {
      onUpdateFlight(modalConfig.fieldKey, selectedTime);
    }
    closeModal();
  };

  return {
    modalConfig,
    handleFieldClick,
    closeModal,
    saveModalTime
  };
}