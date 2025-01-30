/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";

const App = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [repoName, setRepoName] = useState("");
  const tableRef = useRef(null);
  const debounceTimeout = useRef(null);

  const fetchIssues = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/facebook/react/issues?page=${page}&per_page=20`
      );
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();

      if (data.length > 0 && data[0].repository_url) {
        const repoUrl = data[0].repository_url;
        const repoFullName = repoUrl.replace(
          "https://api.github.com/repos/",
          ""
        );
        setRepoName(repoFullName);
      } else {
        console.warn("repository_url is missing or data is empty.");
        setRepoName(""); // or handle it accordingly
      }

      setIssues((prev) => [...prev, ...data]);

      if (data.length === 0) {
        setHasMore(false); // Stop fetching when no more data is available
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [page]);

  const isNearBottom = () => {
    if (!tableRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
    return scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
  };

  const handleScroll = () => {
    if (isNearBottom() && !loading && hasMore) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        setPage((prev) => prev + 1);
      }, 500); // 500ms debounce
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-7xl w-full p-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          🚀 GitHub Issues Infinite Scroll (Debounced)
        </h2>
        {/* Display the repository name */}
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          {repoName || "Loading..."}
        </h1>

        <div
          className="overflow-x-auto max-h-[500px] overflow-y-auto"
          onScroll={handleScroll}
          ref={tableRef}
        >
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Author</th>
                <th className="px-4 py-2">Labels</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-100">
                  <td className="px-4 py-2">{item.title}</td>
                  <td className="px-4 py-2">{item.user.login}</td>
                  <td className="px-4 py-2">
                    {item.labels.length
                      ? item.labels.map((label) => label.name).join(", ")
                      : "No Labels"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="mt-4 text-center text-blue-500">Loading...</div>
        )}
        {error && <div className="text-red-500 text-center">{error}</div>}
        {!loading && !error && issues.length === 0 && (
          <div className="text-center mt-4">No issues found.</div>
        )}
        {!hasMore && (
          <div className="text-center mt-4 text-gray-500">
            🎉 No more issues to load!
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
