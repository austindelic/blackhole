void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    ivec2 p=ivec2(fragCoord);
    vec4 original=texelFetch(iChannel0,p,0);
    int index=p.y*int(iResolution.x)+p.x;
    ivec2 grid=ivec2(ceil(iResolution.xy/uAsciiCellSize));
    int stateIndex=index-bhSourceSize().x*bhSourceSize().y*3;
    if(stateIndex>=0 && stateIndex<grid.x*grid.y*8){
        int cell=stateIndex/8;int component=stateIndex%8;
        vec2 position=(vec2(cell%grid.x,cell/grid.x)+0.5)*uAsciiCellSize;
        bhAnalyze(position);
        original.a=component<4?cellColor[component]:cellState[component-4];
    }
    fragColor=original;
}
