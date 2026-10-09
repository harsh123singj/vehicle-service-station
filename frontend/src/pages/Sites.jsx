
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const initialForm = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
};

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/sites");
      setSites(response.data.sites ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load sites."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await api.post("/sites", form);

      setSuccess(response.data.message || "Site created successfully.");
      setForm(initialForm);
      await fetchSites();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create site."
      );
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: "name", label: "Site Name", required: true },
    { name: "code", label: "Site Code", required: true },
    { name: "address", label: "Address" },
    { name: "city", label: "City" },
    { name: "state", label: "State" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Site Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage vehicle service station sites.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSites}
          disabled={loading}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Create New Site
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  maxLength={field.name === "name" ? 100 : 200}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Site"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Existing Sites ({sites.length})
          </h2>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading sites...</p>
        ) : sites.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-slate-700">No sites found</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first site using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Address</th>
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold">State</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sites.map((site) => (
                  <tr key={site.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {site.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {site.code}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {site.address || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {site.city || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {site.state || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
