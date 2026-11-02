import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-dz-cloud-gray gap-4">
    <h1 className="text-6xl font-bold text-dz-navy">404</h1>
    <p className="text-dz-slate-gray text-lg">الصفحة دي مش موجودة</p>
    <Link
      to="/dashboard"
      className="px-6 py-3 bg-dz-cyan text-dz-navy font-semibold rounded-lg hover:opacity-90 transition"
    >
      الرجوع للرئيسية
    </Link>
  </div>
);
export default NotFoundPage;

