// import { useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { apiFetch } from "../api/client";
// import BarcodeScanner from "./BarcodeScanner";

// export default function AddCattle() {
//   const { farmId } = useParams();
//   const navigate = useNavigate();

//   const [tagId, setTagId] = useState("");
//   const [breed, setBreed] = useState("");
//   const [status, setStatus] = useState("ACTIVE");
//   const [showScanner, setShowScanner] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     try {
//       await apiFetch("/cattle", {
//         method: "POST",
//         body: JSON.stringify({
//           tagId,
//           breed,
//           status,
//           farmId: Number(farmId),
//         }),
//       });
//       navigate(`/cattle/${farmId}`);
//     } catch (err) {
//       if (err.status === 409) {
//         setError("Cattle with this tag ID already exists in this farm.");
//       } else {
//         setError(err.message || "Failed to add cattle.");
//       }
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 px-6 py-4">
//       <button onClick={() => navigate(`/cattle/${farmId}`)}>← Back</button>

//       <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl mt-4">
//         {error && (
//           <div className="mb-3 text-red-600 font-semibold">{error}</div>
//         )}
//         <input
//           className="w-full mb-3 border p-2"
//           placeholder="Tag ID"
//           value={tagId}
//           onChange={(e) => setTagId(e.target.value)}
//         />

//         <button type="button" onClick={() => setShowScanner(true)}>
//           Scan
//         </button>

//         {showScanner && (
//                   <BarcodeScanner
//                     onScanSuccess={(value) => setTagId(value)}
//                     onClose={() => setShowScanner(false)}
//                   />
//                 )}

//         <input
//           className="w-full mb-3 border p-2"
//           placeholder="Breed"
//           value={breed}
//           onChange={(e) => setBreed(e.target.value)}
//         />

//         <select
//           className="w-full mb-3 border p-2"
//           value={status}
//           onChange={(e) => setStatus(e.target.value)}
//         >
//           <option value="ACTIVE">Active</option>
//           <option value="SICK">Sick</option>
//           <option value="SOLD">Sold</option>
//         </select>

//         <button className="w-full bg-green-500 text-white py-2 rounded">
//           Save Cattle
//         </button>
//       </form>
//     </div>
//   );
// }
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import BarcodeScanner from "./BarcodeScanner";
import {
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
} from "@mui/material";

// Define cattle types and their breeds
const CATTLE_TYPES = {
  "COW": ["Holstein", "Jersey", "Guernsey", "Ayrshire", "Brown Swiss", "Milking Shorthorn", "Sahiwal", "Gir", "Red Sindhi"],
  "BUFFALO": ["Murrah", "Nili Ravi", "Surti", "Jaffarabadi", "Bhadawari"],
  "SHEEP": ["Merino", "Suffolk", "Dorper", "Rambouillet", "Lincoln", "Awassi"],
  "GOAT": ["Saanen", "Toggenburg", "Alpine", "LaMancha", "Boer", "Nubian", "Angora"]
};

export default function AddCattle() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [type, setType] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await apiFetch("/cattle", {
        method: "POST",
        body: JSON.stringify({
          tagId,
          breed,
          type,
          status,
          farmId: Number(farmId),
        }),
      });
      navigate(`/cattle/${farmId}`);
    } catch (err) {
      if (err.status === 409) {
        setError("Cattle with this tag ID already exists in this farm.");
      } else {
        setError(err.message || "Failed to add cattle.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Button variant="text" onClick={() => navigate(`/cattle/${farmId}`)}>
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

                <TextField
                  select
                  fullWidth
                  label="Type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setBreed(""); // Reset breed when type changes
                  }}
                >
                  <MenuItem value="COW">Cow</MenuItem>
                  <MenuItem value="BUFFALO">Buffalo</MenuItem>
                  <MenuItem value="SHEEP">Sheep</MenuItem>
                  <MenuItem value="GOAT">Goat</MenuItem>
                </TextField>

                {type && (
                  <TextField
                    select
                    fullWidth
                    label="Breed"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                  >
                    {CATTLE_TYPES[type].map((breedOption) => (
                      <MenuItem key={breedOption} value={breedOption}>
                        {breedOption}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="SICK">Sick</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </TextField>

                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                >
                  Save Cattle
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
