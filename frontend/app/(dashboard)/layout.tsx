import Sidebar from "@/components/layout/sidebar/Sidebar";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex ">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
};

export default layout;
