export default function YourFarms() {
  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">

      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
        <div>
          <p className="text-xs text-gray-500">Welcome</p>
          <p className="font-semibold text-gray-800">Select Your Farm</p>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Your Farms
        </h1>
        <p className="text-sm text-gray-500">
          Choose a farm to view its dashboard.
        </p>
      </div>

      {/* Farms List */}
      <div className="space-y-4">

        {/* Farm Card */}
        <FarmCard />
        <FarmCard />
        <FarmCard />

      </div>

      {/* Add Farm Button */}
      <button
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full font-medium shadow-lg"
      >
        + Add Farm
      </button>
    </div>
  );
}

/* Reusable Farm Card */
function FarmCard() {
  const handleSelectFarm = () => {
    // later: navigate to dashboard with selected farmId
    console.log("Farm selected");
  };

  return (
    <div
      onClick={handleSelectFarm}
      className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition"
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-20 bg-gray-100 rounded"></div>
        </div>
        <div className="text-gray-300 text-xl">›</div>
      </div>
    </div>
  );
}
