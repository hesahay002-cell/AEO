<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  {/* Big Admin Dropdown */}
  <div className="w-full">
    <label className="text-yellow-400 text-sm font-bold mb-2 block">Class / Category</label>
    <select 
      value={newTest.class} 
      onChange={(e) => setNewTest({...newTest, class: e.target.value})}
      className="p-4 text-lg bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full cursor-pointer appearance-none"
    >
      <option value="" disabled>Select Category</option>
      <option value="Class 7">Class 7</option>
      <option value="Class 8">Class 8</option>
      <option value="Class 9">Class 9</option>
      <option value="Class 10">Class 10</option>
      <option value="Class 11">Class 11</option>
      <option value="Class 12">Class 12</option>
      <option value="NEET">NEET</option>
      <option value="JEE">JEE</option>
      <option value="Graduation">Graduation</option>
      <option value="Government Job">Government Job</option>
    </select>
  </div>

  <div className="w-full">
    <label className="text-yellow-400 text-sm font-bold mb-2 block">Subject Name</label>
    <input type="text" placeholder="e.g. Physics" value={newTest.subject} onChange={(e) => setNewTest({...newTest, subject: e.target.value})} className="p-4 text-lg bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
  </div>

  <div className="w-full">
    <label className="text-yellow-400 text-sm font-bold mb-2 block">Total Marks</label>
    <input type="number" placeholder="Marks" value={newTest.marks} onChange={(e) => setNewTest({...newTest, marks: e.target.value})} className="p-4 text-lg bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
  </div>

  <div className="w-full">
    <label className="text-yellow-400 text-sm font-bold mb-2 block">Duration (Mins)</label>
    <input type="number" placeholder="Duration" value={newTest.duration} onChange={(e) => setNewTest({...newTest, duration: e.target.value})} className="p-4 text-lg bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
  </div>

  <div className="w-full">
    <label className="text-yellow-400 text-sm font-bold mb-2 block">Test Start Time</label>
    <input type="datetime-local" value={newTest.startTime} onChange={(e) => setNewTest({...newTest, startTime: e.target.value})} className="p-4 text-lg bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
  </div>

  <div className="w-full">
    <label className="text-yellow-400 text-sm font-bold mb-2 block">Test End Time</label>
    <input type="datetime-local" value={newTest.endTime} onChange={(e) => setNewTest({...newTest, endTime: e.target.value})} className="p-4 text-lg bg-black text-yellow-300 border-2 border-gray-600 rounded-xl outline-none w-full" />
  </div>
</div>
