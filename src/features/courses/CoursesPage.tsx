import { useState } from "react"

const CreateCoursePage = () => {

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newCourse = {
      title,
      description,
      price: Number(price)
    }

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newCourse)
      })

      if (!response.ok) {
        throw new Error("Failed to create course")
      }

      setMessage("Course created successfully!")

      setTitle("")
      setDescription("")
      setPrice("")

    } catch (error) {
      setMessage("Error creating course")
    }
  }

  return (
    <div className="admin-page">
      <h1>Create Course</h1>

      <form onSubmit={handleSubmit}>

        <div>
          <label>Course Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <button type="submit">
          Create Course
        </button>

      </form>

      {message && <p>{message}</p>}
    </div>
  )
}

export default CreateCoursePage