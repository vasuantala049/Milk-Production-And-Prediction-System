export default function AddFarm() {
  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">

      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <button className="text-xl text-gray-600">←</button>
        <div>
          <p className="text-xs text-gray-500">Farm Management</p>
          <p className="font-semibold text-gray-800">Add New Farm</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">

        {/* Farm Name */}
        <InputField
          label="Farm Name"
          placeholder="Enter farm name"
        />

        {/* Farm Address */}
        <InputField
          label="Farm Address"
          placeholder="Enter full farm address"
        />

        {/* Village */}
        <InputField
          label="Village"
          placeholder="Enter village name"
        />

        {/* Taluka */}
        <InputField
          label="Taluka"
          placeholder="Enter taluka"
        />

        {/* District */}
        <InputField
          label="District"
          placeholder="Enter district"
        />

        {/* State */}
        <InputField
          label="State"
          placeholder="Enter state"
        />

        {/* Pincode */}
        <InputField
          label="Pincode"
          placeholder="Enter pincode"
          type="number"
        />

        {/* Submit */}
        <button
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition"
        >
          Save Farm
        </button>

      </div>
    </div>
  );
}

/* Reusable Input Field */
function InputField({ label, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
      />
    </div>
  );
}
