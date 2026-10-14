import type { BuildingType } from '../../model/Building.model'

interface CustomPopup {
  building: BuildingType
}

export default function CustomPopup({ building }: CustomPopup) {
  console.log('building', building)
  return (
    <div className="w-full rounded-xl bg-white">
      {/* Header */}
      <div className="text-lg border-l-3 border-sky-600 font-bold text-sky-600 p-2">
        Thông tin tòa nhà
      </div>

      {/* Information */}
      <div className="px-2">
        {/* Id */}
        <div className="flex items-center gap-2 text-sky-600">
          <p className="text-md flex-1 text-gray-950 font-bold pr-2">id</p>
          <p className=" text-sm text-gray-700 flex-3 bg-gray-100 rounded-md px-2 border border-gray-400">
            {building.id || 'Chưa có thông tin'}
          </p>
        </div>
        {/* Name */}
        <div className="flex items-center gap-2 text-sky-600">
          <p className="text-md flex-1 text-gray-950 font-bold pr-2">Geometry</p>
          {/* Children of Geometry */}
          <div className="flex-3 bg-gray-100 rounded-md px-2 border border-gray-400">
            <p className="text-md flex-1 text-gray-950 font-bold pr-2">type</p>
            <p className="text-sm text-gray-700">{building.geometry.type || 'Chưa có thông tin'}</p>
            <p className="text-md flex-1 text-gray-950 font-bold pr-2">coordinates</p>
            <p className="text-sm text-gray-700">
              {JSON.stringify(building.geometry.coordinates) || 'Chưa có thông tin'}
            </p>
          </div>
        </div>
        {/* Name */}
        <div className="flex items-center gap-2 text-sky-600">
          <p className="text-md flex-1 text-gray-950 font-bold pr-2">Name</p>
          <p className=" text-sm text-gray-700 flex-3 bg-gray-100 rounded-md px-2 border border-gray-400">
            {building.properties.name || 'Chưa có thông tin'}
          </p>
        </div>
      </div>
    </div>
  )
}
