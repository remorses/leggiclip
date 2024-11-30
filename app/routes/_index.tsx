import { Form } from "react-router";

export function meta() {
  return [
    { title: "AI Video Generator" },
    { name: "description", content: "Generate AI videos from your content" },
  ];
}

import { ActionFunction } from "react-router";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const description = formData.get("description") as string;
  const avatar = formData.get("avatar") as string;
  const pdf = formData.get("pdf") as File;

  if (!description || !avatar) {
    return { error: "Description, avatar and PDF file are required" };
  }

  return {
    description,
    avatar,
    pdf
  };
};



export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Generate AI Videos
          </h1>
        </div>

        <Form method="post" className="space-y-6" encType="multipart/form-data">
          <div>
            <label 
              htmlFor="description" 
              className="block text-sm font-medium text-gray-700"
            >
              Video Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              placeholder="Describe what you want in your video..."
              required
            />
          </div>

          <div>
            <label 
              htmlFor="avatar" 
              className="block text-sm font-medium text-gray-700"
            >
              Avatar Gender
            </label>
            <select
              id="avatar"
              defaultValue="male"
              name="avatar"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label 
              htmlFor="pdf" 
              className="block text-sm font-medium text-gray-700"
            >
              Upload PDF
            </label>
            <input
              type="file"
              id="pdf"
              name="pdf"
              accept=".pdf"
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Generate Videos
          </button>
        </Form>
      </div>
    </div>
  );
}
