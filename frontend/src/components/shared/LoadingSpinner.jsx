const LoadingSpinner = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div
      className={`${sizes[size]} border-dz-cyan border-t-transparent rounded-full animate-spin`}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;

