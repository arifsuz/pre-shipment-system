// frontend/src/pages/shipments/ShipmentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, Clock, FileText } from 'lucide-react';
import { shipmentService } from '../../services/shipmentService';
import { Button } from '../../components/ui/Button';
import type { Shipment } from '../../types';

export const ShipmentDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadShipment();
    }
  }, [id]);

  const loadShipment = async () => {
    try {
      const data = await shipmentService.getShipmentById(id!);
      setShipment(data);
    } catch (error) {
      console.error('Error loading shipment:', error);
      alert('Error loading shipment data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!shipment) return;

    try {
      await shipmentService.updateShipmentStatus(shipment.id, newStatus);
      loadShipment();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating shipment status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Shipment not found</h3>
        <Button onClick={() => navigate('/shipments')} className="mt-4">
          Back to Shipments
        </Button>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const config = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
      IN_PROCESS: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'In Process' },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' }
    };
    return config[status as keyof typeof config] || config.DRAFT;
  };

  const statusConfig = getStatusConfig(shipment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/shipments')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipment Details</h1>
            <p className="text-gray-600">Order No: {shipment.orderNo}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {shipment.status !== 'APPROVED' && (
            <Link to={`/shipments/${shipment.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}

          {/* status action buttons removed to disable Mark/Approve actions in UI */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Shipping Mark</label>
                <p className="mt-1 text-sm text-gray-900">{shipment.shippingMark}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Order No</label>
                <p className="mt-1 text-sm text-gray-900">{shipment.orderNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Case No</label>
                <p className="mt-1 text-sm text-gray-900">{shipment.caseNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Destination</label>
                <p className="mt-1 text-sm text-gray-900">{shipment.destination}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Model</label>
                <p className="mt-1 text-sm text-gray-900">{shipment.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Production Month</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(shipment.productionMonth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Case Size</label>
                <p className="mt-1 text-sm text-gray-900">{shipment.caseSize}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Rack No</label>
                <p className="mt-1 text-sm text-gray-900">
                  {Array.isArray(shipment.rackNo) ? shipment.rackNo.join(', ') : (shipment.rackNo || 'N/A')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Gross Weight</label>
                <p className="mt-1 text-sm text-gray-900">{shipment.grossWeight} KGS</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Net Weight</label>
                <p className="mt-1 text-sm text-gray-900">{shipment.netWeight} KGS</p>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Box No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shipment.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.boxNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.partNo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.partName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.remark || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${statusConfig.color}`}>
                <statusConfig.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{statusConfig.label}</p>
                <p className="text-sm text-gray-500">Current status</p>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <p className="text-sm text-gray-900">{shipment.user?.nama}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-sm text-gray-900">
                  {new Date(shipment.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">
                  {new Date(shipment.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};