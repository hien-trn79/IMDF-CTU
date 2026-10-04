import { useEffect, useState } from 'react'
import { Modal, Form, Select, InputNumber, Alert, Divider } from 'antd'
import { NodeIndexOutlined } from '@ant-design/icons'
import type { NetworkEdgeResponse } from '../../model/NetworkEdge.model'
import type { NetworkNodeResponse } from '../../model/NetworkNode.model'
import type { IndoorRouteResponse } from '../../model/IndoorRoute.model'
import { wkbHexToPoint, wkbHexToLineString } from '../../utils/wkbParser'
import { lineStringToWkbHex } from '../../utils/wkbEncoder'

interface FormValues {
  source: number
  target: number
  cost: number
  reverseCost: number
  indoorRouteId: number
}

interface NetworkEdgeFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: {
    source: number
    target: number
    cost: number
    reverseCost: number
    geometry: string
    indoorRouteId: number
  }) => Promise<void>
  initialData: NetworkEdgeResponse | null
  submitting: boolean
  error?: string | null
  indoorRoutes: IndoorRouteResponse[]
  nodes: NetworkNodeResponse[]
}

export default function NetworkEdgeFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  submitting,
  error,
  indoorRoutes,
  nodes,
}: NetworkEdgeFormModalProps) {
  const [form] = Form.useForm<FormValues>()
  const isEdit = !!initialData

  // geometry preview info
  const [geoInfo, setGeoInfo] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.setFieldsValue({
          source: initialData.source,
          target: initialData.target,
          cost: initialData.cost,
          reverseCost: initialData.reverseCost,
          indoorRouteId: initialData.indoorRouteId,
        })
        const pts = wkbHexToLineString(initialData.geometry)
        setGeoInfo(`${pts.length} điểm geometry (từ backend)`)
      } else {
        form.resetFields()
        setGeoInfo('')
      }
    }
  }, [isOpen, initialData, form])

  const handleFinish = async (values: FormValues) => {
    // Tạo geometry LineString từ tọa độ của source + target node
    const srcNode = nodes.find((n) => n.id === values.source)
    const tgtNode = nodes.find((n) => n.id === values.target)

    let geometry = ''
    if (
      initialData?.geometry &&
      values.source === initialData.source &&
      values.target === initialData.target
    ) {
      // Giữ nguyên geometry gốc nếu không đổi source/target
      geometry = initialData.geometry
    } else if (srcNode && tgtNode) {
      const srcCoords = wkbHexToPoint(srcNode.geom)
      const tgtCoords = wkbHexToPoint(tgtNode.geom)
      if (srcCoords && tgtCoords) {
        geometry = lineStringToWkbHex([srcCoords, tgtCoords])
      }
    }

    if (!geometry) {
      // Fallback: nếu không build được geometry, báo lỗi
      throw new Error('Không thể tạo geometry LineString. Hãy kiểm tra tọa độ Node nguồn và đích.')
    }

    await onSubmit({
      source: values.source,
      target: values.target,
      cost: values.cost,
      reverseCost: values.reverseCost,
      geometry,
      indoorRouteId: values.indoorRouteId,
    })
  }

  const handleValuesChange = (_: any, all: FormValues) => {
    if (all.source && all.target) {
      const s = nodes.find((n) => n.id === all.source)
      const t = nodes.find((n) => n.id === all.target)
      if (s && t) {
        const sc = wkbHexToPoint(s.geom)
        const tc = wkbHexToPoint(t.geom)
        if (sc && tc) {
          setGeoInfo(
            `LineString: [${sc[1].toFixed(6)},${sc[0].toFixed(6)}] → [${tc[1].toFixed(6)},${tc[0].toFixed(6)}]`
          )
        }
      }
    }
  }

  const nodeOptions = nodes.map((n) => ({
    value: n.id,
    label: `#${n.id} — ${n.isConnector ? '[C]' : ''} (${(() => {
      const c = wkbHexToPoint(n.geom)
      return c ? `${c[1].toFixed(5)}, ${c[0].toFixed(5)}` : 'N/A'
    })()})`,
  }))

  return (
    <Modal
      title={
        <span className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <NodeIndexOutlined className="text-indigo-600" />
          {isEdit ? 'Chỉnh sửa Network Edge' : 'Thêm Network Edge mới'}
        </span>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText={isEdit ? 'Lưu thay đổi' : 'Tạo Edge'}
      cancelText="Hủy bỏ"
      destroyOnClose
      maskClosable={!submitting}
      width={560}
    >
      <div className="pt-3">
        {error && (
          <Alert
            message="Lỗi lưu dữ liệu"
            description={error}
            type="error"
            showIcon
            closable
            className="mb-4"
          />
        )}

        {isEdit && initialData && (
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-4 text-sm text-gray-600">
            <span className="text-gray-500 mr-2">ID Edge:</span>
            <span className="font-bold text-indigo-800">#{initialData.id}</span>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={handleValuesChange}
          requiredMark="optional"
          disabled={submitting}
        >
          <Form.Item
            name="indoorRouteId"
            label={<span className="font-medium text-gray-700">Tuyến đường (Indoor Route)</span>}
            rules={[{ required: true, message: 'Chọn tuyến đường' }]}
          >
            <Select
              placeholder="Chọn tuyến đường..."
              showSearch
              optionFilterProp="label"
              size="large"
              options={indoorRoutes.map((r) => ({
                value: r.id,
                label: `#${r.id} — ${r.indoorRouteName}`,
              }))}
            />
          </Form.Item>

          <Divider titlePlacement="start" plain className="!text-xs !text-gray-500">
            Kết nối Node
          </Divider>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="source"
              label={<span className="font-medium text-gray-700">Node nguồn (Source)</span>}
              rules={[{ required: true, message: 'Chọn node nguồn' }]}
            >
              <Select
                placeholder="Node nguồn..."
                showSearch
                optionFilterProp="label"
                size="large"
                options={nodeOptions}
              />
            </Form.Item>

            <Form.Item
              name="target"
              label={<span className="font-medium text-gray-700">Node đích (Target)</span>}
              rules={[{ required: true, message: 'Chọn node đích' }]}
            >
              <Select
                placeholder="Node đích..."
                showSearch
                optionFilterProp="label"
                size="large"
                options={nodeOptions}
              />
            </Form.Item>
          </div>

          {geoInfo && (
            <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100 mb-3 -mt-2">
              <p className="text-[11px] text-indigo-600 font-medium">
                📍 Geometry preview: {geoInfo}
              </p>
            </div>
          )}

          <Divider titlePlacement="start" plain className="!text-xs !text-gray-500">
            Chi phí đường đi
          </Divider>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="cost"
              label={<span className="font-medium text-gray-700">Cost (chiều đi)</span>}
              rules={[{ required: true, message: 'Nhập cost' }]}
            >
              <InputNumber
                placeholder="0.01"
                className="w-full"
                size="large"
                step={0.001}
                precision={4}
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="reverseCost"
              label={<span className="font-medium text-gray-700">Reverse Cost</span>}
              rules={[{ required: true, message: 'Nhập reverse cost' }]}
            >
              <InputNumber
                placeholder="0.01"
                className="w-full"
                size="large"
                step={0.001}
                precision={4}
                min={0}
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  )
}
