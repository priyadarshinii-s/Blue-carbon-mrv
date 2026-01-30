import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateProject = () => {
  const navigate = useNavigate();

  const [project, setProject] = useState({
    name: "",
    type: "",
    location: "",
    description: "",
  });

  const handleChange = (e) => {
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Basic validation
    if (!project.name || !project.type || !project.location) {
      alert("Please fill all required fields");
      return;
    }

    // UI-only action
    console.log("Project saved:", project);

    alert("Project created successfully");

    // Navigate back to project list
    navigate("/admin/projects");
  };

  return (
    <>
      <h1>Create New Project</h1>
      <p>Define a new blue carbon project</p>

      <div className="card mt-20">
        <label>Project Name *</label>
        <input
          type="text"
          name="name"
          placeholder="Eg: Mangrove Restoration – Odisha"
          value={project.name}
          onChange={handleChange}
        />

        <label>Project Type *</label>
        <select
          name="type"
          value={project.type}
          onChange={handleChange}
        >
          <option value="">Select type</option>
          <option>Mangrove</option>
          <option>Seagrass</option>
          <option>Salt Marsh</option>
        </select>

        <label>Location *</label>
        <input
          type="text"
          name="location"
          placeholder="State / Region"
          value={project.location}
          onChange={handleChange}
        />

        <label>Description</label>
        <textarea
          name="description"
          placeholder="Brief project description"
          value={project.description}
          onChange={handleChange}
        />

        <button className="primary-btn mt-20" onClick={handleSave}>
          Save Project
        </button>
      </div>
    </>
  );
};

export default CreateProject;


// const CreateProject = () => {
//   return (
//     <>
//       <h1>Create New Project</h1>
//       <p>Define a new blue carbon project</p>

//       <div className="card mt-20">
//         <label>Project Name</label>
//         <input type="text" placeholder="Eg: Mangrove Restoration – Odisha" />

//         <label>Project Type</label>
//         <select>
//           <option>Mangrove</option>
//           <option>Seagrass</option>
//           <option>Salt Marsh</option>
//         </select>

//         <label>Location</label>
//         <input type="text" placeholder="State / Region" />

//         <label>Description</label>
//         <textarea placeholder="Brief project description" />

//         <button className="primary-btn mt-20">
//           Save Project
//         </button>
//       </div>
//     </>
//   );
// };

// export default CreateProject;