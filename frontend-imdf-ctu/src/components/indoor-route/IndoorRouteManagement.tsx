import { useEffect, useState, useMemo } from 'react'
import { ConfigProvider, message, Alert, Button, Input, Space } from 'antd'
import {
  ReloadOutlined, PlusOutlined, SearchOutlined, NodeIndexOutlined
} from '@ant-design/icons'
import viVN from 'antd/locale/vi_VN'

import { indoorRouteService } from '../../services/indoorRouteService'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'

import IndoorRouteTable from './IndoorRouteTable'
import IndoorRouteDetailDrawer from './IndoorRouteDetailDrawer'
import IndoorRouteFormModal from './IndoorRouteFormModal'

export default function IndoorRouteManagement() {
  const [routes, setRoutes] = useState<IndoorRouteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search state
  const [searchText, setSearchText] = useState('')

  // UI state
  const [selectedRoute, setSelectedRoute] = useState<IndoorRouteResponse | null>(null)
  const [editingRoute, setEditingRoute] = useState<IndoorRouteResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchRoutes = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await indoorRouteService.getAll()
      setRoutes(data)
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách Tuyến đường từ Backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  // Filter routes based on search text
  const filteredRoutes = useMemo(() => {
    if (!searchText) return routes
    const query = searchText.toLowerCase()
    return routes.filter((r) =>
      r.indoorRouteName.toLowerCase().includes(query) ||
      r.indoorRouteId.toLowerCase().includes(query) ||
      r.id.toString().includes(query) ||
      (r.description && r.description.toLowerCase().includes(query))
    )
  }, [routes, searchText])

  // Handlers
  const handleOpenCreate = () => {
    setEditingRoute(null)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (route: IndoorRouteResponse) => {
    setEditingRoute(route)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: any) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editingRoute) {
        const updated = await indoorRouteService.update(editingRoute.id, data)
        setRoutes((prev) => prev.map((r) => r.id === editingRoute.id ? updated : r))
        if (selectedRoute?.id === editingRoute.id) {
          setSelectedRoute(updated)
        }
        message.success('Cập nhật Tuyến đường thành công!')
      } else {
        const created = await indoorRouteService.create(data)
        setRoutes((prev) => [created, ...prev])
        message.success('Tạo Tuyến đường mới thành công!')
      }
      setIsModalOpen(false)
      setEditingRoute(null)
    } catch (err: any) {
      setSubmitError(err?.message || 'Có lỗi xảy ra khi lưu dữ liệu.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await indoorRouteService.delete(id)
      setRoutes((prev) => prev.filter((r) => r.id !== id))
      if (selectedRoute?.id === id) {
        setSelectedRoute(null)
      }
      message.success('Đã xóa Tuyến đường thành công!')
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi xóa Tuyến đường.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#0284c7', // sky-600
          borderRadius: 8,
          fontFamily: 'inherit',
        }
      }}
    >
      <div className="h-full flex flex-col min-h-0 bg-slate-50/50 p-4 gap-4">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <NodeIndexOutlined className="text-sky-600" />
              Tuyến đường nội khu
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý danh sách các tuyến đường (Indoor Route) trong hệ thống
            </p>
          </div>
          
          <Space>
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchRoutes}
              disabled={loading}
              className="text-gray-600 border-gray-300 hover:text-sky-600 hover:border-sky-300"
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
              className="bg-sky-600 hover:bg-sky-500 shadow-sm font-medium px-5"
            >
              Thêm Tuyến đường
            </Button>
          </Space>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            showIcon
            message="Lỗi kết nối đến Backend"
            description={error}
            action={
              <Button size="small" danger onClick={fetchRoutes} icon={<ReloadOutlined />}>
                Thử lại
              </Button>
            }
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          
          {/* Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
            <Input
              placeholder="Tìm kiếm theo Tên, ID, UUID, Mô tả..."
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-md"
              size="middle"
            />
            
            <div className="text-sm text-gray-500 font-medium">
              Đang hiển thị: <span className="text-sky-700 font-bold">{filteredRoutes.length}</span> / {routes.length}
            </div>
          </div>

          {/* Table */}
          <IndoorRouteTable
            routes={filteredRoutes}
            loading={loading}
            selectedId={selectedRoute?.id || null}
            onView={(route) => setSelectedRoute(route)}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
            onOpenCreate={handleOpenCreate}
          />

        </div>

        {/* Drawer */}
        <IndoorRouteDetailDrawer
          open={!!selectedRoute}
          onClose={() => setSelectedRoute(null)}
          route={selectedRoute}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          deleting={deletingId === selectedRoute?.id}
        />

        {/* Modal */}
        <IndoorRouteFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingRoute(null) }}
          onSubmit={handleSubmit}
          initialData={editingRoute}
          submitting={submitting}
          error={submitError}
        />
        
      </div>
    </ConfigProvider>
  )
}
