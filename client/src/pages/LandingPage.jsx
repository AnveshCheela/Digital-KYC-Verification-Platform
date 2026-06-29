import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <>
      <section className="py-xxl px-gutter max-w-container-max mx-auto flex flex-col md:flex-row items-center gap-xl flex-grow justify-center mt-8">
        <div className="w-full md:w-1/2 flex flex-col gap-lg">
          <h1 className="font-headline-xl text-headline-xl text-primary md:text-[48px] md:leading-[56px]">
            Identity Verification for Modern Fintech.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            Automate your KYC with OCR and fraud-aware logic. Built for speed, precision, and compliance at scale.
          </p>
          <div className="flex gap-md mt-sm">
            <Link to="/register" className="bg-secondary text-on-secondary px-lg py-md rounded font-label-md hover:opacity-90 transition-opacity">
              Get Started
            </Link>
            <Link to="/login" className="border border-tertiary text-tertiary px-lg py-md rounded font-label-md hover:bg-surface-container-low transition-colors">
              Login to Account
            </Link>
          </div>
        </div>
        <div className="w-full md:w-1/2 rounded-xl overflow-hidden border border-surface-border relative h-[400px] bg-surface-container-low">
          <div className="absolute inset-0 flex items-center justify-center text-outline">
            <div className="w-full h-full bg-gradient-to-tr from-secondary-container to-tertiary-container opacity-80" />
          </div>
        </div>
      </section>

      <section className="py-xxl px-gutter max-w-container-max mx-auto bg-surface w-full mt-12">
        <div className="mb-xl text-center">
          <h2 className="font-headline-lg text-headline-lg text-primary">Engineered for Accuracy</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Comprehensive tools to manage the verification lifecycle.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-md h-full">
            <div className="flex items-center gap-sm text-secondary">
              <span className="material-symbols-outlined">queue</span>
              <h3 className="font-headline-md text-headline-md">Queue-based processing</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
              Manage high volumes of verification requests efficiently. Our intelligent queue system prioritizes cases based on risk score and SLA requirements.
            </p>
          </div>
          <div className="col-span-1 bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-md h-full">
            <div className="flex items-center gap-sm text-secondary">
              <span className="material-symbols-outlined">document_scanner</span>
              <h3 className="font-headline-md text-headline-md">Real-time OCR</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
              Instant extraction for PAN, Aadhaar, and passports with 99.8% accuracy.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
