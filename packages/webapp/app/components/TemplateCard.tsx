export default function TemplateCard({
  imgSrc,
  title,
  description,
}: {
  imgSrc: string;
  title: string;
  description: string;
}) {
  return (
    <div className="basis-80">
      <div className="w-full h-48 max-h-48 bg-slate-100 rounded-lg overflow-hidden object-contain">
        <img src={imgSrc} alt="template" className="" />
      </div>
      <p className="text-md font-semibold mt-2">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}
