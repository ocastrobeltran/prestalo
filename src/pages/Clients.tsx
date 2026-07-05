import React, { useState } from 'react';
import type { Client, Loan } from '../types';
import { formatCurrency } from '../services/loanCalculator';
import { Search, UserPlus, Phone, MapPin, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ProgressBar } from '../components/common/ProgressBar';

interface ClientsProps {
  clients: Client[];
  loans: Loan[];
  openNewClientModal: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export const Clients: React.FC<ClientsProps> = ({
  clients,
  loans,
  openNewClientModal,
  onEditClient,
  onDeleteClient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.documentId.includes(query) ||
      client.phone.includes(query)
    );
  });

  const activeClientsCount = clients.filter(c => c.status === 'active').length;
  // Supongamos un límite ficticio de 10 clientes para concordar exactamente con la captura "6/10 DISPONIBLE"
  const totalCupo = 10;
  const cupoPercentage = (activeClientsCount / totalCupo) * 100;

  const toggleExpandClient = (clientId: string) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
    } else {
      setExpandedClientId(clientId);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente "${name}"? Se perderán también sus préstamos relacionados.`)) {
      onDeleteClient(id);
    }
  };

  // Obtener préstamos de un cliente específico
  const getClientLoans = (clientId: string) => {
    return loans.filter(l => l.clientId === clientId);
  };

  return (
    <div className="clients-container animate-fade-in">
      {/* Cupo Card (de acuerdo a la captura 3) */}
      <div className="cupo-card shadow-sm">
        <div className="cupo-header">
          <div className="cupo-title-wrap">
            <span className="cupo-title">Clientes</span>
            <span className="cupo-status">DISPONIBLE</span>
          </div>
          <span className="cupo-fraction">{activeClientsCount}/{totalCupo}</span>
        </div>
        <ProgressBar progress={cupoPercentage} color="var(--success)" />
        <div className="cupo-footer">
          <span>{cupoPercentage.toFixed(0)}% Utilizado</span>
        </div>
      </div>

      {/* Buscador y Botón de Añadir */}
      <div className="search-bar-wrap">
        <div className="search-input-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="add-client-btn" onClick={openNewClientModal}>
          <UserPlus size={18} />
          <span>Cliente</span>
        </button>
      </div>

      {/* Lista de Clientes */}
      <div className="clients-list">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron clientes.</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientLoans = getClientLoans(client.id);
            const activeLoans = clientLoans.filter(l => l.status === 'active');
            const totalLent = clientLoans.reduce((acc, curr) => acc + curr.capital, 0);
            const isExpanded = expandedClientId === client.id;

            return (
              <div key={client.id} className={`client-card shadow-sm ${isExpanded ? 'expanded' : ''}`}>
                <div className="client-main-info" onClick={() => toggleExpandClient(client.id)}>
                  <div className="client-title-row">
                    <h4 className="client-name">{client.name}</h4>
                    <span className="client-financial-summary">
                      {totalLent > 0 ? formatCurrency(totalLent) : '$ 0,00'}
                    </span>
                  </div>
                  
                  <div className="client-contact-row">
                    <a 
                      href={`tel:${client.phone}`} 
                      className="contact-link"
                      onClick={(e) => e.stopPropagation()} // Evitar expandir al llamar
                    >
                      <Phone size={13} />
                      {client.phone}
                    </a>
                    
                    <span className="loans-badge">
                      {activeLoans.length} préstamo{activeLoans.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="client-location-row">
                    <span className="location-text">
                      <MapPin size={13} />
                      {client.address}
                    </span>
                  </div>

                  <div className="client-footer-row">
                    <span className="date-text">
                      Creado: {client.createdAt}
                    </span>
                    <div className="arrow-icon-wrapper">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Sección Expandida (Historial de Préstamos y Acciones de Edición) */}
                {isExpanded && (
                  <div className="client-expand-section animate-scale-in">
                    <div className="client-actions-row">
                      <button className="client-action-btn edit" onClick={() => onEditClient(client)}>
                        <Edit2 size={13} />
                        Editar
                      </button>
                      <button className="client-action-btn delete" onClick={() => handleDeleteClick(client.id, client.name)}>
                        <Trash2 size={13} />
                        Eliminar
                      </button>
                    </div>

                    <div className="loans-history-section">
                      <h5>Historial de Créditos ({clientLoans.length})</h5>
                      {clientLoans.length === 0 ? (
                        <p className="no-loans-text">Este cliente aún no tiene préstamos registrados.</p>
                      ) : (
                        <div className="client-loans-list">
                          {clientLoans.map((loan) => (
                            <div key={loan.id} className="client-loan-item">
                              <div className="loan-item-header">
                                <span className={`loan-status-dot ${loan.status}`}></span>
                                <span className="loan-item-id font-semibold">ID: {loan.id}</span>
                                <span className={`loan-status-text ${loan.status}`}>
                                  {loan.status === 'active' ? 'Activo' : 
                                   loan.status === 'completed' ? 'Pagado' : 'Mora'}
                                </span>
                              </div>
                              <div className="loan-item-details">
                                <div className="detail-col">
                                  <span className="detail-lbl">Prestado:</span>
                                  <span className="detail-val">{formatCurrency(loan.capital)}</span>
                                </div>
                                <div className="detail-col">
                                  <span className="detail-lbl">Total:</span>
                                  <span className="detail-val">{formatCurrency(loan.totalToPay)}</span>
                                </div>
                                <div className="detail-col">
                                  <span className="detail-lbl">Frecuencia:</span>
                                  <span className="detail-val capitalise">{loan.paymentFrequency}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .clients-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cupo-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
        }

        .cupo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .cupo-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cupo-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cupo-status {
          font-size: 10px;
          font-weight: 800;
          color: var(--success);
          background-color: rgba(16, 185, 129, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .cupo-fraction {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
          color: var(--success);
        }

        .cupo-footer {
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-tertiary);
          text-align: right;
        }

        .search-bar-wrap {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .search-input-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-tertiary);
        }

        .search-input-container input {
          width: 100%;
          padding: 12px;
          padding-left: 38px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-card);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }

        .search-input-container input:focus {
          border-color: var(--primary);
        }

        .add-client-btn {
          background-color: var(--primary);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: var(--shadow-sm);
        }

        .clients-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .client-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .client-main-info {
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .client-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .client-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .client-financial-summary {
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 700;
          color: var(--success);
        }

        .client-contact-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .contact-link {
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .loans-badge {
          background-color: rgba(14, 165, 233, 0.08);
          color: var(--primary);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .client-location-row {
          display: flex;
          align-items: center;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .location-text {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .client-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          border-top: 1px solid rgba(0, 0, 0, 0.02);
          padding-top: 8px;
        }

        .date-text {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .arrow-icon-wrapper {
          color: var(--text-tertiary);
        }

        .client-expand-section {
          padding: 16px;
          border-top: 1px solid var(--border-color);
          background-color: var(--bg-input);
        }

        .client-actions-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .client-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .client-action-btn.edit {
          border: 1px solid var(--border-color);
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        .client-action-btn.delete {
          background-color: rgba(239, 68, 68, 0.08);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .loans-history-section h5 {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .no-loans-text {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .client-loans-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .client-loan-item {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 10px;
        }

        .loan-item-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .loan-status-dot {
          height: 8px;
          width: 8px;
          border-radius: 50%;
        }

        .loan-status-dot.active { background-color: var(--primary); }
        .loan-status-dot.completed { background-color: var(--success); }
        .loan-status-dot.overdue { background-color: var(--danger); }

        .loan-item-id {
          font-size: 12px;
          color: var(--text-primary);
          flex: 1;
        }

        .loan-status-text {
          font-size: 11px;
          font-weight: 700;
        }

        .loan-status-text.active { color: var(--primary); }
        .loan-status-text.completed { color: var(--success); }
        .loan-status-text.overdue { color: var(--danger); }

        .loan-item-details {
          display: flex;
          justify-content: space-between;
        }

        .detail-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-lbl {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .detail-val {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .capitalise {
          text-transform: capitalize;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
};
