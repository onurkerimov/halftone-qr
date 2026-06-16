deps :
	pnpm install

build : deps
	pnpm run build

preview : build
	pnpm run preview

serve : deps
	pnpm run dev
