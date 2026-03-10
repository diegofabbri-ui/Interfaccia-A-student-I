import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

const SearchComponent = () => {
  return (
    <div className="relative flex items-center justify-center">
      <div id="poda" className="relative flex items-center justify-center group">
        {/* Glow layers - Modified to Black/Monochrome to match the theme */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[70px] max-w-[314px] rounded-xl blur-[3px] 
                        before:absolute before:content-[''] before:z-[-2] before:w-[999px] before:h-[999px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-60
                        before:bg-[conic-gradient(transparent,rgba(0,0,0,0.8)_5%,transparent_38%,transparent_50%,rgba(0,0,0,0.6)_60%,transparent_87%)] before:transition-all before:duration-2000
                        group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]">
        </div>
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[65px] max-w-[312px] rounded-xl blur-[3px] 
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                        before:bg-[conic-gradient(transparent,rgba(0,0,0,0.5),transparent_10%,transparent_50%,rgba(0,0,0,0.7),transparent_60%)] before:transition-all before:duration-2000
                        group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
        </div>
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[63px] max-w-[307px] rounded-lg blur-[2px] 
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[83deg]
                        before:bg-[conic-gradient(transparent_0%,rgba(0,0,0,0.3),transparent_8%,transparent_50%,rgba(0,0,0,0.4),transparent_58%)] before:brightness-140
                        before:transition-all before:duration-2000 group-hover:before:rotate-[-97deg] group-focus-within:before:rotate-[443deg] group-focus-within:before:duration-[4000ms]">
        </div>

        <div id="main" className="relative group">
          <input placeholder="Cerca..." type="text" name="text" className="bg-white border border-zinc-200 w-[301px] h-[56px] rounded-lg text-zinc-900 px-[59px] text-lg focus:outline-none placeholder-zinc-400 shadow-sm transition-shadow group-focus-within:shadow-md" />
          <div id="input-mask" className="pointer-events-none w-[100px] h-[20px] absolute bg-gradient-to-r from-transparent to-white top-[18px] left-[70px] group-focus-within:hidden"></div>
          <div id="black-mask" className="pointer-events-none w-[30px] h-[20px] absolute bg-zinc-200 top-[10px] left-[5px] blur-2xl opacity-80 transition-all duration-2000 group-hover:opacity-0"></div>
          
          <div className="absolute h-[42px] w-[40px] overflow-hidden top-[7px] right-[7px] rounded-lg
                          before:absolute before:content-[''] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-90
                          before:bg-[conic-gradient(transparent,rgba(0,0,0,0.1),transparent_50%,transparent_50%,rgba(0,0,0,0.1),transparent_100%)]
                          before:animate-[spin_4s_linear_infinite]">
          </div>
          <div id="filter-icon" className="absolute top-2 right-2 flex items-center justify-center z-[2] max-h-10 max-w-[38px] h-full w-full [isolation:isolate] overflow-hidden rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer">
            <SlidersHorizontal className="w-5 h-5 text-zinc-600" strokeWidth={1.5} />
          </div>
          <div id="search-icon" className="absolute left-5 top-[16px]">
            <Search className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchComponent;
