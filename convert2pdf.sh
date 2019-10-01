for i in {1..304};
do
  inkscape results/file$i.svg --export-pdf=pdf/hoja$i.pdf
done
