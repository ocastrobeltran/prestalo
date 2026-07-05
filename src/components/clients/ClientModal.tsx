import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Client } from '../../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id' | 'createdAt' | 'status'> & { id?: string }) => void;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, clientToEdit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setPhone(clientToEdit.phone);
      setDocumentId(clientToEdit.documentId);
      setAddress(clientToEdit.address);
    } else {
      setName('');
      setPhone('');
      setDocumentId('');
      setAddress('');
    }
    setError('');
  }, [clientToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !documentId.trim() || !address.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    
    onSave({
      id: clientToEdit?.id,
      name: name.trim(),
      phone: phone.trim(),
      documentId: documentId.trim(),
      address: address.trim()
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
    >
      <form onSubmit={handleSubmit} className="client-form">
        {error && <div className="form-error">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="client-name">Nombres y Apellidos</label>
          <input
            id="client-name"
            type="text"
            placeholder="Ej. Juan Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="client-doc">Número de Documento</label>
          <input
            id="client-doc"
            type="text"
            placeholder="Ej. 1047123456"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="client-phone">Número de Teléfono</label>
          <input
            id="client-phone"
            type="tel"
            placeholder="Ej. +57 300 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="client-address">Dirección / Referencia de Ubicación</label>
          <input
            id="client-address"
            type="text"
            placeholder="Ej. Calle 10 #4-15 o Nequi/Negocio"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <button type="submit" className="form-submit-btn">
          {clientToEdit ? 'Guardar Cambios' : 'Registrar Cliente'}
        </button>
      </form>

      <style>{`
        .client-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-error {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border-left: 3px solid var(--danger);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-primary);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
        }

        .form-submit-btn {
          margin-top: 8px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          color: white;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(14, 165, 233, 0.2);
        }
      `}</style>
    </Modal>
  );
};
