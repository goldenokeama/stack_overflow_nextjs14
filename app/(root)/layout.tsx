import LeftSidebar from "@/components/shared/LeftSidebar";
import RightSidebar from "@/components/shared/RightSidebar";
import Navbar from "@/components/shared/navbar/Navbar";
import React from "react";

// In the Layout Component below from line 7 to line 18, we essentially have the entire structure of our application
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="background-light850_dark100 relative">
      <Navbar />
      <div className="flex">
        <LeftSidebar />
        <section className="flex min-h-screen flex-1 flex-col px-6 pt-36 max-md:pb-14 sm:p-14">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </section>
        <RightSidebar />
      </div>
      {/* <Toaster/> */}
      {/* Toaster component, a notification that pops up once we do some kind of action  */}
      T
    </main>
  );
};

export default Layout;
