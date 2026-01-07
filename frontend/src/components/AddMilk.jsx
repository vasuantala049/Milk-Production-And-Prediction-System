// import { useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { apiFetch } from "../api/client";
// import BarcodeScanner from "../components/BarcodeScanner";

// export default function AddMilk() {
//   const { farmId } = useParams();
//   const navigate = useNavigate();

//   const [tagId, setTagId] = useState("");
//   const [session, setSession] = useState("");
//   const [milkLiters, setMilkLiters] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showScanner, setShowScanner] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!tagId || !session || !milkLiters) {
//       setError("All fields are required");
//       return;
//     }

//     if (Number(milkLiters) <= 0) {
//       setError("Milk liters must be greater than 0");
//       return;
//     }

//     setLoading(true);

//     try {
//       await apiFetch("/milk/today", {
//         method: "POST",
//         body: JSON.stringify({
//           farmId: sessionStorage.getItem("activeFarm")
//             ? JSON.parse(sessionStorage.getItem("activeFarm")).id
//             : Number(farmId),
//           tagId,
//           session,
//           milkLiters: Number(milkLiters),
//         }),
//       });

//       navigate(`/cattle/${farmId}`);
//     } catch {
//       setError("Enter valid tag ID");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#f7faf7] px-6 py-6">
//       <button onClick={() => navigate(-1)} className="mb-4 text-gray-600">
//         ← Back
//       </button>

//       <h1 className="text-2xl font-bold mb-6">Add Milk</h1>

//       <form
//         onSubmit={handleSubmit}
//         className="bg-white p-6 rounded-xl shadow-sm space-y-4"
//       >
//         {/* Tag ID */}
//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Tag ID
//           </label>

//           <div className="flex gap-2">
//             <input
//               type="text"
//               value={tagId}
//               onChange={(e) => setTagId(e.target.value)}
//               placeholder="Scan or enter tag ID"
//               className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400"
//             />
//             <button type="button" onClick={() => setShowScanner(true)}>
//               Scan
//             </button>

//           </div>
//         </div>

//         {/* BarcodeScanner Scanner */}
//         {showScanner && (
//           <BarcodeScanner
//             onScanSuccess={(value) => setTagId(value)}
//             onClose={() => setShowScanner(false)}
//           />
//         )}



//         {/* Session */}
//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Milk Session
//           </label>
//           <select
//             value={session}
//             onChange={(e) => setSession(e.target.value)}
//             className="w-full border rounded-lg px-3 py-2"
//           >
//             <option value="">Select session</option>
//             <option value="MORNING">Morning</option>
//             <option value="EVENING">Evening</option>
//           </select>
//         </div>

//         {/* Milk Liters */}
//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Milk (Liters)
//           </label>
//           <input
//             type="number"
//             step="0.1"
//             value={milkLiters}
//             onChange={(e) => setMilkLiters(e.target.value)}
//             className="w-full border rounded-lg px-3 py-2"
//           />
//         </div>

//         {error && <p className="text-red-600 text-sm">{error}</p>}

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
//         >
//           {loading ? "Saving..." : "Save Milk Entry"}
//         </button>
//       </form>
//     </div>
//   );
// }
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import BarcodeScanner from "../components/BarcodeScanner";
import {
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
} from "@mui/material";

export default function AddMilk() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [session, setSession] = useState("");
  const [milkLiters, setMilkLiters] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tagId || !session || !milkLiters) {
      setError("All fields are required");
      return;
    }

    if (Number(milkLiters) <= 0) {
      setError("Milk liters must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/milk/today", {
        method: "POST",
        body: JSON.stringify({
          farmId: localStorage.getItem("activeFarm")
            ? JSON.parse(localStorage.getItem("activeFarm")).id
            : Number(farmId),
          tagId,
          session,
          milkLiters: Number(milkLiters),
        }),
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Failed to add milk entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Button variant="text" onClick={() => navigate(-1)}>
          ← Back
        </Button>

        <Card className="mt-4">
          <CardContent>
            {error && (
              <div className="text-red-600 font-semibold mb-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* 🔥 ALL spacing controlled here */}
              <Stack spacing={2}>
                {/* Tag ID */}
                <TextField
                  fullWidth
                  label="Tag ID"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  placeholder="Scan or enter tag ID"
                />

                <Button
                  variant="outlined"
                  onClick={() => setShowScanner(true)}
                >
                  Scan Barcode
                </Button>

                {showScanner && (
                  <BarcodeScanner
                    onScanSuccess={(value) => {
                      setTagId(value);
                      setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                  />
                )}

                {/* Session */}
                <TextField
                  select
                  fullWidth
                  label="Milk Session"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                >
                  <MenuItem value="">Select session</MenuItem>
                  <MenuItem value="MORNING">Morning</MenuItem>
                  <MenuItem value="EVENING">Evening</MenuItem>
                </TextField>

                {/* Milk Liters */}
                <TextField
                  fullWidth
                  type="number"
                  label="Milk (Liters)"
                  inputProps={{ step: 0.1, min: 0 }}
                  value={milkLiters}
                  onChange={(e) => setMilkLiters(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Milk Entry"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
