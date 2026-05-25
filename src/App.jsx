import React, { useState, useMemo } from 'react';
import { 
  Users, BarChart3, Table as TableIcon, Filter, 
  GraduationCap, AlertCircle, Plus, Trash2, Search, Upload, Download, Eye, EyeOff, Sliders
} from 'lucide-react';

// Color progression helper for table grades
const getGradeColor = (score) => {
  const s = parseInt(score);
  if (s === 4) return 'text-purple-600 bg-purple-50';
  if (s === 3) return 'text-emerald-600 bg-emerald-50';
  if (s === 2) return 'text-amber-600 bg-amber-50';
  if (s === 1) return 'text-red-600 bg-red-50';
  return 'text-slate-600 bg-slate-50';
};

// Color progression helper for progress bars (Red -> Yellow -> Green -> Purple)
const getProgressBarColor = (percent) => {
  if (percent >= 80) return 'bg-purple-500';
  if (percent >= 60) return 'bg-emerald-500';
  if (percent >= 40) return 'bg-amber-400';
  return 'bg-red-400';
};

// Initial default dummy data
const defaultPupils = [
  { id: 1, forename: 'James', surname: 'Smith', tracked: 'y', attendance: 95.4, legacy: 'y', gender: 'm', simd12: 'y', simd910: 'n', eal: 'y', ce: 'n', asn: 'y', numeracy: 3, tl: 3, reading: 2, writing: 2, literacy: 2, hwb: 2 },
  { id: 2, forename: 'Emma', surname: 'Johnson', tracked: 'y', attendance: 95.7, legacy: 'y', gender: 'f', simd12: 'y', simd910: 'n', eal: 'n', ce: 'y', asn: 'n', numeracy: 3, tl: 4, reading: 4, writing: 3, literacy: 3, hwb: 4 },
  { id: 3, forename: 'Liam', surname: 'Williams', tracked: 'y', attendance: 100, legacy: 'n', gender: 'm', simd12: 'n', simd910: 'y', eal: 'n', ce: 'n', asn: 'n', numeracy: 4, tl: 3, reading: 3, writing: 3, literacy: 3, hwb: 3 },
  { id: 4, forename: 'Olivia', surname: 'Brown', tracked: 'y', attendance: 87.0, legacy: 'y', gender: 'f', simd12: 'y', simd910: 'n', eal: 'n', ce: 'n', asn: 'y', numeracy: 2, tl: 2, reading: 2, writing: 1, literacy: 1, hwb: 2 },
  { id: 5, forename: 'Noah', surname: 'Jones', tracked: 'n', attendance: 92.1, legacy: 'n', gender: 'm', simd12: 'y', simd910: 'n', eal: 'y', ce: 'n', asn: 'y', numeracy: 3, tl: 3, reading: 2, writing: 2, literacy: 2, hwb: 3 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pupils, setPupils] = useState(defaultPupils);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusGroup, setFocusGroup] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');
  const [appName, setAppName] = useState('Riverbank Tracker');
  const [wholeSchoolLabel, setWholeSchoolLabel] = useState('Whole School');
  const [showAttendanceSection, setShowAttendanceSection] = useState(true);
  const [attendanceInterval, setAttendanceInterval] = useState(10); // 5 or 10
  const fileInputRef = React.useRef(null);

  // Input Handlers
  const handleAddPupil = () => {
    const newPupil = {
      id: Date.now(), forename: '', surname: '', tracked: 'y', attendance: 100, legacy: 'n', gender: 'm', simd12: 'n', simd910: 'n', eal: 'n', ce: 'n', asn: 'n', numeracy: 2, tl: 2, reading: 2, writing: 2, literacy: 2, hwb: 2
    };
    setPupils([newPupil, ...pupils]);
  };

  const handleUpdatePupil = (id, field, value) => {
    setPupils(pupils.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleDeletePupil = (id) => {
    setPupils(pupils.filter(p => p.id !== id));
  };

  // CSV Parsing setup match Columns B-S
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n');
      let headerIndex = -1;

      // Find the row where the actual column headers (B-S) begin
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].includes('Tracked?') && rows[i].includes('Attendance')) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) {
        setErrorMsg('Could not find the correct headers. Please ensure the CSV format matches your original spreadsheet.');
        return;
      }

      const newPupils = [];
      for (let i = headerIndex + 1; i < rows.length; i++) {
        const row = rows[i].split(','); 
        
        // Ensure the row has enough columns and a valid 'Tracked' flag to filter out summary tables at the bottom
        const trackedVal = row[4]?.trim().toLowerCase();
        if (row.length < 18 || (trackedVal !== 'y' && trackedVal !== 'n')) {
          continue; 
        }

        newPupils.push({
          id: Date.now() + i,
          forename: row[2]?.trim() || '',
          surname: row[3]?.trim() || '',
          tracked: trackedVal,
          attendance: parseFloat(row[5]) || 0,
          legacy: row[6]?.trim().toLowerCase(),
          gender: row[7]?.trim().toLowerCase(),
          simd12: row[8]?.trim().toLowerCase(),
          simd910: row[9]?.trim().toLowerCase(),
          eal: row[10]?.trim().toLowerCase(),
          ce: row[11]?.trim().toLowerCase(),
          asn: row[12]?.trim().toLowerCase(),
          numeracy: parseInt(row[13]) || 0,
          tl: parseInt(row[14]) || 0,
          reading: parseInt(row[15]) || 0,
          writing: parseInt(row[16]) || 0,
          literacy: parseInt(row[17]) || 0,
          hwb: parseInt(row[18]) || 0,
        });
      }

      if (newPupils.length > 0) {
        setPupils(newPupils);
        setActiveTab('dashboard'); // Auto-switch to see the new data
      } else {
        setErrorMsg('No valid pupil data found in the CSV.');
      }
    };
    reader.readAsText(file);
    event.target.value = null; // reset input
  };

  // Generate downloadable updated CSV
  const handleDownloadCSV = () => {
    const headerRow = [
      "", "", "Forename", "Surname", "Tracked?", "Attendance", "Legacy?", 
      "Gender", "SIMD 1/2", "SIMD 9/10", "EAL", "CE", "ASN", 
      "Numeracy", "T/L", "Reading", "Writing", "Literacy", "HWB"
    ];
    
    const csvRows = [headerRow.join(',')];
    
    pupils.forEach((p, index) => {
      const rowData = [
        "", index + 1, p.forename, p.surname, p.tracked, p.attendance, p.legacy,
        p.gender, p.simd12, p.simd910, p.eal, p.ce, p.asn,
        p.numeracy, p.tl, p.reading, p.writing, p.literacy, p.hwb
      ];
      csvRows.push(rowData.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${appName.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Demographic Calculations
  const trackedPupils = useMemo(() => pupils.filter(p => p.tracked === 'y'), [pupils]);

  const demographics = useMemo(() => {
    return {
      roll: trackedPupils.length,
      boys: trackedPupils.filter(p => p.gender === 'm').length,
      girls: trackedPupils.filter(p => p.gender === 'f').length,
      simd12: trackedPupils.filter(p => p.simd12 === 'y').length,
      simd910: trackedPupils.filter(p => p.simd910 === 'y').length,
      eal: trackedPupils.filter(p => p.eal === 'y').length,
      ce: trackedPupils.filter(p => p.ce === 'y').length,
      asn: trackedPupils.filter(p => p.asn === 'y').length,
      legacy: trackedPupils.filter(p => p.legacy === 'y').length,
      avgAttendance: trackedPupils.length ? (trackedPupils.reduce((acc, p) => acc + parseFloat(p.attendance || 0), 0) / trackedPupils.length).toFixed(1) : 0
    };
  }, [trackedPupils]);

  // Dashboard Filters
  const filteredPupils = useMemo(() => {
    switch (focusGroup) {
      case 'male': return trackedPupils.filter(p => p.gender === 'm');
      case 'female': return trackedPupils.filter(p => p.gender === 'f');
      case 'simd12': return trackedPupils.filter(p => p.simd12 === 'y');
      case 'eal': return trackedPupils.filter(p => p.eal === 'y');
      case 'ce': return trackedPupils.filter(p => p.ce === 'y');
      case 'asn': return trackedPupils.filter(p => p.asn === 'y');
      case 'legacy': return trackedPupils.filter(p => p.legacy === 'y');
      default: return trackedPupils;
    }
  }, [trackedPupils, focusGroup]);

  // General Track rate logic (Grades 3-4 are considered on-track)
  const getProgressStats = (data, field) => {
    if (data.length === 0) return { count: 0, percent: 0 };
    const onTrack = data.filter(p => parseInt(p[field]) >= 3).length;
    return {
      count: onTrack,
      percent: Math.round((onTrack / data.length) * 100)
    };
  };

  const progressData = {
    Numeracy: getProgressStats(filteredPupils, 'numeracy'),
    'Talking & Listening': getProgressStats(filteredPupils, 'tl'),
    Reading: getProgressStats(filteredPupils, 'reading'),
    Writing: getProgressStats(filteredPupils, 'writing'),
    Literacy: getProgressStats(filteredPupils, 'literacy'),
    'Health & Wellbeing': getProgressStats(filteredPupils, 'hwb'),
  };

  // Dynamic attendance correlation calculations for Literacy, Numeracy, and HWB individually
  const attendanceBinsData = useMemo(() => {
    const step = attendanceInterval;
    const bins = [];
    
    for (let min = 0; min < 100; min += step) {
      const max = min + step;
      const binPupils = filteredPupils.filter(p => {
        const att = parseFloat(p.attendance);
        if (isNaN(att)) return false;
        return att >= min && (max === 100 ? att <= max : att < max);
      });

      if (binPupils.length > 0) {
        // Calculate Literacy % on track (Score >= 3)
        const litOnTrack = binPupils.filter(p => parseInt(p.literacy) >= 3).length;
        const litPercent = Math.round((litOnTrack / binPupils.length) * 100);

        // Calculate Numeracy % on track (Score >= 3)
        const numOnTrack = binPupils.filter(p => parseInt(p.numeracy) >= 3).length;
        const numPercent = Math.round((numOnTrack / binPupils.length) * 100);

        // Calculate HWB % on track (Score >= 3)
        const hwbOnTrack = binPupils.filter(p => parseInt(p.hwb) >= 3).length;
        const hwbPercent = Math.round((hwbOnTrack / binPupils.length) * 100);

        bins.push({
          range: `${min}-${max}%`,
          total: binPupils.length,
          literacy: { count: litOnTrack, percent: litPercent },
          numeracy: { count: numOnTrack, percent: numPercent },
          hwb: { count: hwbOnTrack, percent: hwbPercent }
        });
      }
    }
    return bins;
  }, [filteredPupils, attendanceInterval]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Header & Navigation */}
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-blue-300" />
              <input 
                type="text" 
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="font-bold text-xl tracking-wide bg-transparent border-b border-transparent hover:border-blue-400 focus:border-white focus:outline-none text-white transition-colors py-1 w-48 sm:w-64 placeholder-blue-300"
                placeholder="Enter App Name"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-800'}`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-800'}`}
              >
                <TableIcon className="h-4 w-4" />
                <span>Pupil Data</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {errorMsg && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4 mx-4 sm:mx-6 lg:mx-8 rounded shadow-sm flex justify-between items-center animate-bounce">
          <p className="font-medium">{errorMsg}</p>
          <button onClick={() => setErrorMsg('')} className="text-red-700 font-bold hover:text-red-900 text-lg">&times;</button>
        </div>
      )}

      {/* Main Content View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Demographic Metric Overview Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Tracked Roll</p>
                <p className="text-4xl font-bold text-blue-900">{demographics.roll}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Avg Attendance</p>
                <p className={`text-4xl font-bold ${demographics.avgAttendance >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {demographics.avgAttendance}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Care Experienced</p>
                <p className="text-4xl font-bold text-indigo-600">{demographics.ce}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">SIMD 1 & 2</p>
                <p className="text-4xl font-bold text-purple-600">{demographics.simd12}</p>
              </div>
            </div>

            {/* Dashboard Visualizer */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Curriculum Area Tracking
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Showing % of pupils on track (Score 3 or 4)</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">View Data For:</span>
                  <select 
                    value={focusGroup} 
                    onChange={(e) => setFocusGroup(e.target.value)}
                    className="text-sm border-none bg-transparent focus:ring-0 text-blue-700 font-bold cursor-pointer"
                  >
                    <option value="all">{wholeSchoolLabel} ({demographics.roll})</option>
                    <option value="male">Boys ({demographics.boys})</option>
                    <option value="female">Girls ({demographics.girls})</option>
                    <option value="simd12">SIMD 1/2 ({demographics.simd12})</option>
                    <option value="eal">EAL ({demographics.eal})</option>
                    <option value="ce">Care Experienced ({demographics.ce})</option>
                    <option value="asn">ASN ({demographics.asn})</option>
                    <option value="legacy">Legacy ({demographics.legacy})</option>
                  </select>
                </div>
              </div>

              <div className="p-6">
                {filteredPupils.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                    <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                    <p>No pupils found in this group.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {Object.entries(progressData).map(([subject, data]) => (
                      <div key={subject} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="font-semibold text-slate-700">{subject}</span>
                          <span className="text-sm font-medium text-slate-500">
                            {data.count} / {filteredPupils.length} pupils ({data.percent}%)
                          </span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressBarColor(data.percent)}`}
                            style={{ width: `${data.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance & Progress Correlation Module */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-indigo-600" />
                    Attendance & Progress Correlation
                  </h2>
                  <button
                    onClick={() => setShowAttendanceSection(!showAttendanceSection)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                    title={showAttendanceSection ? "Hide Section" : "Show Section"}
                  >
                    {showAttendanceSection ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {showAttendanceSection && (
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Intervals:</span>
                    <button
                      onClick={() => setAttendanceInterval(10)}
                      className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${attendanceInterval === 10 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      10%
                    </button>
                    <button
                      onClick={() => setAttendanceInterval(5)}
                      className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${attendanceInterval === 5 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      5%
                    </button>
                  </div>
                )}
              </div>

              {showAttendanceSection ? (
                <div className="p-6">
                  {filteredPupils.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                      <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                      <p>No pupils in this filter group to analyze.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="text-sm text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                        Analyzing the percentage of pupils who are <strong>On Track</strong> (scoring 3 or 4) separately for <strong>Literacy</strong>, <strong>Numeracy</strong>, and <strong>Health & Wellbeing (HWB)</strong> within each attendance interval. Only active intervals containing pupils are shown.
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                        {attendanceBinsData.map((bin) => (
                          <div key={bin.range} className="p-4 bg-slate-50/70 rounded-xl border border-slate-150 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                              <span className="font-bold text-indigo-950 text-base">{bin.range} Attendance Range</span>
                              <span className="text-xs font-medium text-slate-500 px-2 py-0.5 bg-white rounded-full border border-slate-200">
                                {bin.total} {bin.total === 1 ? 'Pupil' : 'Pupils'}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {/* Literacy bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                  <span>Literacy</span>
                                  <span>{bin.literacy.count} / {bin.total} on track ({bin.literacy.percent}%)</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressBarColor(bin.literacy.percent)}`}
                                    style={{ width: `${bin.literacy.percent}%` }}
                                  />
                                </div>
                              </div>

                              {/* Numeracy bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                  <span>Numeracy</span>
                                  <span>{bin.numeracy.count} / {bin.total} on track ({bin.numeracy.percent}%)</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressBarColor(bin.numeracy.percent)}`}
                                    style={{ width: `${bin.numeracy.percent}%` }}
                                  />
                                </div>
                              </div>

                              {/* HWB bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                  <span>Health & Wellbeing (HWB)</span>
                                  <span>{bin.hwb.count} / {bin.total} on track ({bin.hwb.percent}%)</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressBarColor(bin.hwb.percent)}`}
                                    style={{ width: `${bin.hwb.percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 py-8 italic flex flex-col items-center justify-center">
                  <Sliders className="h-8 w-8 text-slate-300 mb-2" />
                  <p>Attendance Analysis section is hidden. Click the eye icon above to toggle it back on.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Rename Input with no external text label */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <input 
                type="text" 
                value={wholeSchoolLabel}
                onChange={(e) => setWholeSchoolLabel(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm font-normal w-full sm:w-72 text-slate-700"
                placeholder="Rename 'Whole School' category..."
                title="Rename 'Whole School' category"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search pupils by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full rounded-md border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                />
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-sm font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload CSV</span>
                </button>
                <button 
                  onClick={handleDownloadCSV}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-sm font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download CSV</span>
                </button>
                <button 
                  onClick={handleAddPupil}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Pupil</span>
                </button>
              </div>
            </div>

            {/* Spreadsheet Table Wrapper */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 z-10 bg-slate-50 shadow-[1px_0_0_0_#e2e8f0]">Pupil Name</th>
                      <th className="px-3 py-3 text-center border-l border-slate-200 bg-blue-50/50" colSpan="3">Status</th>
                      <th className="px-3 py-3 text-center border-l border-slate-200 bg-purple-50/50" colSpan="6">Demographics</th>
                      <th className="px-3 py-3 text-center border-l border-slate-200 bg-emerald-50/50" colSpan="6">Curriculum Grades (1-4)</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                    <tr className="text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2 font-medium sticky left-0 z-10 bg-slate-50 shadow-[1px_0_0_0_#e2e8f0]">First & Last Name</th>
                      
                      {/* Status */}
                      <th className="px-3 py-2 font-medium border-l border-slate-200 bg-blue-50/50">Tracked</th>
                      <th className="px-3 py-2 font-medium bg-blue-50/50">Att %</th>
                      <th className="px-3 py-2 font-medium bg-blue-50/50">Legacy</th>
                      
                      {/* Demographics */}
                      <th className="px-3 py-2 font-medium border-l border-slate-200 bg-purple-50/50">Gender</th>
                      <th className="px-3 py-2 font-medium bg-purple-50/50" title="SIMD 1 or 2">S 1/2</th>
                      <th className="px-3 py-2 font-medium bg-purple-50/50" title="SIMD 9 or 10">S 9/10</th>
                      <th className="px-3 py-2 font-medium bg-purple-50/50">EAL</th>
                      <th className="px-3 py-2 font-medium bg-purple-50/50">CE</th>
                      <th className="px-3 py-2 font-medium bg-purple-50/50">ASN</th>
                      
                      {/* Grades */}
                      <th className="px-3 py-2 font-medium border-l border-slate-200 bg-emerald-50/50">Num</th>
                      <th className="px-3 py-2 font-medium bg-emerald-50/50">T/L</th>
                      <th className="px-3 py-2 font-medium bg-emerald-50/50">Read</th>
                      <th className="px-3 py-2 font-medium bg-emerald-50/50">Write</th>
                      <th className="px-3 py-2 font-medium bg-emerald-50/50">Lit</th>
                      <th className="px-3 py-2 font-medium bg-emerald-50/50">HWB</th>
                      
                      <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pupils
                      .filter(p => `${p.forename} ${p.surname}`.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((pupil) => (
                      <tr key={pupil.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-2 sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_0_#e2e8f0]">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={pupil.forename}
                              placeholder="First"
                              onChange={(e) => handleUpdatePupil(pupil.id, 'forename', e.target.value)}
                              className="w-24 p-1 text-sm border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white"
                            />
                            <input
                              type="text"
                              value={pupil.surname}
                              placeholder="Last"
                              onChange={(e) => handleUpdatePupil(pupil.id, 'surname', e.target.value)}
                              className="w-28 p-1 text-sm border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white font-medium"
                            />
                          </div>
                        </td>

                        {/* Status Columns */}
                        <td className="px-3 py-2 border-l border-slate-100">
                          <select value={pupil.tracked} onChange={(e) => handleUpdatePupil(pupil.id, 'tracked', e.target.value)} className="p-1 text-sm rounded border-transparent hover:border-slate-300 bg-transparent cursor-pointer">
                            <option value="y">Yes</option><option value="n">No</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={pupil.attendance} onChange={(e) => handleUpdatePupil(pupil.id, 'attendance', e.target.value)} className="w-16 p-1 text-sm border border-transparent hover:border-slate-300 rounded bg-transparent text-center" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={pupil.legacy} onChange={(e) => handleUpdatePupil(pupil.id, 'legacy', e.target.value)} className="p-1 text-sm rounded border-transparent hover:border-slate-300 bg-transparent cursor-pointer">
                            <option value="y">Yes</option><option value="n">No</option>
                          </select>
                        </td>

                        {/* Demographics Columns */}
                        <td className="px-3 py-2 border-l border-slate-100">
                          <select value={pupil.gender} onChange={(e) => handleUpdatePupil(pupil.id, 'gender', e.target.value)} className="p-1 text-sm rounded border-transparent hover:border-slate-300 bg-transparent cursor-pointer">
                            <option value="m">M</option><option value="f">F</option>
                          </select>
                        </td>
                        {['simd12', 'simd910', 'eal', 'ce', 'asn'].map((field) => (
                          <td key={field} className="px-3 py-2">
                            <select 
                              value={pupil[field]} 
                              onChange={(e) => handleUpdatePupil(pupil.id, field, e.target.value)} 
                              className={`p-1 text-sm rounded border-transparent hover:border-slate-300 bg-transparent cursor-pointer font-medium ${pupil[field] === 'y' ? 'text-indigo-600' : 'text-slate-400'}`}
                            >
                              <option value="y">Y</option><option value="n">N</option>
                            </select>
                          </td>
                        ))}

                        {/* Grades Columns */}
                        <td className="px-3 py-2 border-l border-slate-100">
                          <select value={pupil.numeracy} onChange={(e) => handleUpdatePupil(pupil.id, 'numeracy', e.target.value)} className={`p-1 text-sm rounded font-bold cursor-pointer border-transparent hover:border-slate-300 ${getGradeColor(pupil.numeracy)}`}>
                            <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                          </select>
                        </td>
                        {['tl', 'reading', 'writing', 'literacy', 'hwb'].map((field) => (
                          <td key={field} className="px-3 py-2">
                            <select 
                              value={pupil[field]} 
                              onChange={(e) => handleUpdatePupil(pupil.id, field, e.target.value)} 
                              className={`p-1 text-sm rounded font-bold cursor-pointer border-transparent hover:border-slate-300 ${getGradeColor(pupil[field])}`}
                            >
                              <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                            </select>
                          </td>
                        ))}

                        {/* Actions */}
                        <td className="px-3 py-2 text-center">
                          <button 
                            onClick={() => handleDeletePupil(pupil.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete Pupil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}