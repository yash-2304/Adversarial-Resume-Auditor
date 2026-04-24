"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<any>(null);
  const [improved, setImproved] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePdfUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    // dynamically import ONLY in browser
    if (typeof window === "undefined") return;

    // @ts-ignore
    const pdfjsLib = await import("pdfjs-dist/build/pdf");

    // use locally hosted worker to avoid version mismatch and CDN issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

    const reader = new FileReader();

    reader.onload = async () => {
      const typedarray = new Uint8Array(reader.result as ArrayBuffer);
      const pdf = await pdfjsLib.getDocument({
        data: typedarray,
      }).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(" ") + "\n";
      }

      setResume(text);
    };

    reader.readAsArrayBuffer(file);
  };

  const analyze = async () => {
    console.log("BUTTON CLICKED");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: resume,
          jobDescription: jd,
        }),
      });

      const data = await res.json();
      console.log(data);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const improveResume = async () => {
    console.log("IMPROVE RESUME CLICKED");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: resume,
          jobDescription: jd,
          mode: "improve",
        }),
      });

      const data = await res.json();

      if (data?.improved && Array.isArray(data.improved)) {
        setImproved(data.improved.join("\n"));
      } else {
        setImproved("Improved resume generation coming soon");
      }
    } catch (e) {
      console.error(e);
      setImproved("Something went wrong while improving the resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 space-y-6 min-h-screen text-white bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Adversarial Resume Auditor
      </h1>

      <label className="block w-full p-4 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
        {fileName ? fileName : "Upload Resume (PDF)"}
        <input
          id="fileUpload"
          type="file"
          accept="application/pdf"
          onChange={handlePdfUpload}
          className="hidden"
        />
      </label>

      <textarea
        placeholder="Paste Resume"
        onChange={(e) => setResume(e.target.value)}
        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <textarea
        placeholder="Paste Job Description"
        onChange={(e) => setJd(e.target.value)}
        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={analyze}
        disabled={loading}
        className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition transform ${
          loading
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105"
        } text-white`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Analyzing...
          </span>
        ) : (
          "Analyze Resume"
        )}
      </button>

      {loading && !result && (
        <div className="space-y-4 mt-6 animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 space-y-3">
              <div className="h-5 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-4/5"></div>
            </div>

            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 space-y-3">
              <div className="h-5 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6 mt-6">
          {(() => {
            const gptData = result.gpt || result;
            const altData = result.alt || result;
            const diff = Math.abs((gptData?.score || 0) - (altData?.score || 0));

            return (
              <>
                <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                  {(() => {
                    const gptScore = gptData?.score || 0;
                    const atsScore = altData?.score || 0;
                    const avg = Math.round((gptScore + atsScore) / 2);
                    let label = "Risky Resume";
                    let color = "text-yellow-400";
                    if (avg >= 80) { label = "Strong Match"; color = "text-green-400"; }
                    else if (avg < 60) { label = "Likely Rejected by ATS"; color = "text-red-400"; }
                    return (
                      <div>
                        <h2 className={`text-2xl font-extrabold ${color}`}>{label}</h2>
                        <p className="mt-2 text-gray-300">
                          Your resume may be misjudged by automated systems despite being qualified. Fix the risks below to improve screening outcomes.
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Score Comparison */}
                <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                  <h2 className="text-xl font-bold mb-4">Score Comparison</h2>

                  <div className="space-y-4">
                    <div>
                      <p>GPT: {gptData?.score}</p>
                      <div className="w-full bg-gray-700 h-3 rounded">
                        <div
                          className="bg-green-500 h-3 rounded"
                          style={{ width: `${gptData?.score || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <p>ATS: {altData?.score}</p>
                      <div className="w-full bg-gray-700 h-3 rounded">
                        <div
                          className="bg-red-500 h-3 rounded"
                          style={{ width: `${altData?.score || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Disagreement Insight */}
                <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                  <h2 className="text-xl font-bold">AI Disagreement Insight</h2>
                  <p className="mt-2">Score difference: {diff} points</p>
                  <p className="mt-2 text-gray-300">
                    {diff === 0
                      ? "Both systems agree on score, but may still interpret your profile differently."
                      : "One system may pass you while another rejects you. Your outcome is inconsistent."}
                  </p>
                </div>

                {/* GPT vs ATS Analysis */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                    <h2 className="text-xl font-bold mb-2">GPT Analysis</h2>
                    <p className="text-2xl mb-2">Score: {gptData?.score}/100</p>

                    <h3 className="font-semibold mt-3">Missing Keywords</h3>
                    <ul className="list-disc ml-6">
                      {gptData?.missing_keywords?.map((k: string, i: number) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                    <h2 className="text-xl font-bold mb-2">ATS Analysis</h2>
                    <p className="text-2xl mb-2">Score: {altData?.score}/100</p>

                    <h3 className="font-semibold mt-3">Missing Keywords</h3>
                    <ul className="list-disc ml-6">
                      {altData?.missing_keywords?.map((k: string, i: number) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Blind Spots */}
                {result?.blind_spots && result.blind_spots.length > 0 && (
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                    <h2 className="text-xl font-bold">Where AI Will Misjudge You</h2>
                    <ul className="list-disc ml-6 mt-2">
                      {result.blind_spots.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disagreement Highlights */}
                {result?.disagreements && result.disagreements.length > 0 && (
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                    <h2 className="text-xl font-bold">Conflicting AI Decisions</h2>
                    <ul className="list-disc ml-6 mt-2">
                      {result.disagreements.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Adversarial Insights (How to Beat AI) */}
                {result?.adversarial && (
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                    <h2 className="text-xl font-bold mb-4">How to Beat AI Screening</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2 text-green-400">GPT Insights</h3>
                        <ul className="list-disc ml-6 space-y-1">
                          {result.adversarial.gpt?.map((a: any, i: number) => (
                            <li key={i} className="mb-3 p-3 rounded-lg bg-black/30 border border-white/10">
                              <p className="text-yellow-300 font-semibold">Risk:</p>
                              <p className="text-sm mb-1">{a.issue}</p>

                              <p className="text-blue-300 font-semibold">AI Behavior:</p>
                              <p className="text-sm mb-1">{a.why}</p>

                              <p className="text-green-300 font-semibold">Fix to Beat AI:</p>
                              <p className="text-sm mb-1">{a.exploit}</p>

                              <p className="text-purple-300 font-semibold">Outcome:</p>
                              <p className="text-sm">{a.impact}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 text-red-400">ATS Insights</h3>
                        <ul className="list-disc ml-6 space-y-1">
                          {result.adversarial.alt?.map((a: any, i: number) => (
                            <li key={i} className="mb-3 p-3 rounded-lg bg-black/30 border border-white/10">
                              <p className="text-yellow-300 font-semibold">Risk:</p>
                              <p className="text-sm mb-1">{a.issue}</p>

                              <p className="text-blue-300 font-semibold">AI Behavior:</p>
                              <p className="text-sm mb-1">{a.why}</p>

                              <p className="text-green-300 font-semibold">Fix to Beat AI:</p>
                              <p className="text-sm mb-1">{a.exploit}</p>

                              <p className="text-purple-300 font-semibold">Outcome:</p>
                              <p className="text-sm">{a.impact}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Human Context Addendum */}
                {result?.addendum && (
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                    <h2 className="text-xl font-bold">Human Context Addendum</h2>
                    <p className="mt-2 whitespace-pre-line">{result.addendum}</p>
                  </div>
                )}

                {/* Improve Resume Button */}
                <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                  <button
                    onClick={improveResume}
                    disabled={loading}
                    className={`px-6 py-3 rounded-xl font-semibold transition transform ${
                      loading
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-teal-500 hover:scale-105"
                    } text-white`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Processing...
                      </span>
                    ) : (
                      "Improve Resume Based on AI Feedback"
                    )}
                  </button>
                </div>

                {/* Improved Resume Output */}
                {improved && (
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                    <h2 className="text-xl font-bold">Improved Resume</h2>
                    <ul className="list-disc ml-6 mt-2">
                      {improved.split("\n").map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}